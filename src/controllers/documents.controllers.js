// controllers/documents.controllers.js
import { pool } from "../db.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from "url";
import { createNotification } from './notifications.controllers.js';

// Obtener __dirname si usas módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de multer: guarda en ../uploads relativo a este controlador
const storage = multer.diskStorage({
  destination: path.join(__dirname, '..', 'uploads'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);               // nombre único para evitar colisiones
  }
});

const upload = multer({ storage });

// Helper para mapear la fila al formato que espera el frontend
const mapDocument = (row) => {
  let archivos = [];
  try {
    archivos = JSON.parse(row.s3_key || '[]');
    if (!Array.isArray(archivos)) archivos = []; // por si es string pero no array
  } catch (e) {
    // si no es JSON válido, dejamos array vacío
    archivos = [];
  }

  return {
    id: row.id,
    nombre: row.serial_registro,
    descripcion: row.descripcion,
    tipo: row.tipo_documento,
    fechaCreacion: row.fecha_registro,
    tamano: row.tamano || 0,
    url: row.s3_url_bucket || '',
    usuarioSubio: row.creado_por_username,
    remitente: row.remitente,
    estado: row.estado,
    urgencia: row.urgencia,
    asignadoA: row.asignado_a_username,
    departamento: row.departamento,
    direccion: row.direccion || 'entrada',
    destino: row.destino || null,
    archivos,                     // array de strings con los nombres de archivo
  };
};

export const getDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.rol;
    const { direccion } = req.query; // filtro opcional: 'entrada' o 'salida'

    let query = `
      SELECT 
        d.id,
        d.serial_registro,
        d.fecha_registro,
        d.remitente,
        d.descripcion,
        dep.nombre AS departamento,
        td.nombre AS tipo_documento,
        ed.nombre AS estado,
        d.urgencia,
        d.s3_key,
        d.s3_url_bucket,
        u_creador.username AS creado_por_username,
        u_asignado.username AS asignado_a_username,
        d.creado_por,
        d.asignado_a,
        d.direccion,
        d.destino
      FROM documentos d
      INNER JOIN departamentos dep ON d.departamento_id = dep.id
      INNER JOIN tipos_de_documentos td ON d.tipo_doc_id = td.id
      INNER JOIN estados_documentos ed ON d.estado_id = ed.id
      INNER JOIN usuarios u_creador ON d.creado_por = u_creador.id
      LEFT JOIN usuarios u_asignado ON d.asignado_a = u_asignado.id
    `;

    const params = [];
    const conditions = [];

    // Filtrado por rol: Admin/root ven todo; otros solo sus documentos (creados o asignados)
    if (role === 3) {
      params.push(userId);
      conditions.push(`(d.creado_por = $${params.length} OR d.asignado_a = $${params.length})`);
    }

    // Filtrado por dirección si se especifica
    if (direccion && (direccion === 'entrada' || direccion === 'salida')) {
      params.push(direccion);
      conditions.push(`d.direccion = $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ` + conditions.join(' AND ');
    }

    query += ` ORDER BY d.fecha_registro DESC`;

    const { rows } = await pool.query(query, params);
    const documents = rows.map(mapDocument);
    res.json(documents);
  } catch (error) {
    console.error('Error en getDocuments:', error);
    res.status(500).json({ error: 'Error al obtener documentos' });
  }
};

export const uploadDocument = async (req, res) => {
  try {
    const {
      serial_registro,
      remitente,
      descripcion,
      departamento,        // string (nombre)
      urgencia,
      tiposDocumento,      // array de strings, tomaremos el primero
      direccion,           // 'entrada' o 'salida'
      destino              // string, solo para salida
    } = req.body;

    const docDireccion = direccion || 'entrada';

    // 1. Obtener ID del departamento
    const depRes = await pool.query('SELECT id FROM departamentos WHERE nombre = $1', [departamento]);
    if (depRes.rows.length === 0) return res.status(400).json({ error: 'Departamento inválido' });
    const departamento_id = depRes.rows[0].id;

    // 2. Obtener ID del tipo de documento (primer elemento del array)
    let tipo_doc_id = null;
    if (tiposDocumento && tiposDocumento.length > 0) {
      const tipoRes = await pool.query('SELECT id FROM tipos_de_documentos WHERE nombre = $1', [tiposDocumento[0]]);
      if (tipoRes.rows.length > 0) tipo_doc_id = tipoRes.rows[0].id;
    }

    // 3. Estado por defecto (por ejemplo "Pendiente" = 1)
    const estado_id = 1; // Asegúrate de que exista en tu tabla estados_documentos

    // 4. Usuario creado desde el token
    const creado_por = req.user.id;
    const asignado_a = departamento_id;   // por ahora sin asignar

    // 5. Para documentos de salida, urgencia es NULL
    const docUrgencia = docDireccion === 'salida' ? null : urgencia;

    // 6. Destino solo aplica para salida
    const docDestino = docDireccion === 'salida' ? (destino || null) : null;

    // Insertar el documento
    const { rows } = await pool.query(
      `INSERT INTO documentos 
       (serial_registro, remitente, descripcion, departamento_id, tipo_doc_id, 
        estado_id, urgencia, s3_key, s3_url_bucket, creado_por, asignado_a, direccion, destino)
       VALUES ($1, $2, $3, $4, $5, $6, $7, '[]', NULL, $8, $9, $10, $11) RETURNING *`,
      [serial_registro, remitente, descripcion, departamento_id, tipo_doc_id, estado_id, docUrgencia, creado_por, asignado_a, docDireccion, docDestino]
    );

    const documentId = rows[0].id;

    // Notificar a todos los usuarios del departamento al que se asignó el documento (si es entrada)
    // Opcionalmente, puedes notificar también en salida si así lo desean.
    if (docDireccion === 'entrada') {
      const usersInDep = await pool.query('SELECT id FROM usuarios WHERE departamento_id = $1', [departamento_id]);
      for (const u of usersInDep.rows) {
        // No notificamos al mismo creador si pertenece al mismo departamento
        if (u.id !== creado_por) {
          await createNotification(u.id, documentId, docUrgencia, serial_registro);
        }
      }
    }

    // Re-query to get joined data for proper mapping
    const { rows: fullRows } = await pool.query(
      `SELECT 
        d.id, d.serial_registro, d.fecha_registro, d.remitente, d.descripcion,
        dep.nombre AS departamento, td.nombre AS tipo_documento, ed.nombre AS estado,
        d.urgencia, d.s3_key, d.s3_url_bucket,
        u_creador.username AS creado_por_username,
        u_asignado.username AS asignado_a_username,
        d.creado_por, d.asignado_a, d.direccion, d.destino
      FROM documentos d
      INNER JOIN departamentos dep ON d.departamento_id = dep.id
      INNER JOIN tipos_de_documentos td ON d.tipo_doc_id = td.id
      INNER JOIN estados_documentos ed ON d.estado_id = ed.id
      INNER JOIN usuarios u_creador ON d.creado_por = u_creador.id
      LEFT JOIN usuarios u_asignado ON d.asignado_a = u_asignado.id
      WHERE d.id = $1`,
      [rows[0].id]
    );

    res.status(201).json(mapDocument(fullRows[0]));
  } catch (error) {
    console.error('Error creando documento:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Error: El serial de registro ingresado ya existe.' });
    }
    res.status(500).json({ error: 'Error al crear documento' });
  }
};


export const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.rol;

    const { rows } = await pool.query(
      `SELECT 
        d.id,
        d.serial_registro,
        d.fecha_registro,
        d.remitente,
        d.descripcion,
        dep.nombre AS departamento,
        td.nombre AS tipo_documento,
        ed.nombre AS estado,
        d.urgencia,
        d.s3_key,
        d.s3_url_bucket,
        u_creador.username AS creado_por_username,
        u_asignado.username AS asignado_a_username,
        d.creado_por,
        d.asignado_a,
        d.direccion,
        d.destino
      FROM documentos d
      INNER JOIN departamentos dep ON d.departamento_id = dep.id
      INNER JOIN tipos_de_documentos td ON d.tipo_doc_id = td.id
      INNER JOIN estados_documentos ed ON d.estado_id = ed.id
      INNER JOIN usuarios u_creador ON d.creado_por = u_creador.id
      LEFT JOIN usuarios u_asignado ON d.asignado_a = u_asignado.id
      WHERE d.id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    const doc = rows[0];

    // Verificar acceso: solo si es admin/root, o si el usuario es creador/asignado
    if (role === 3 && doc.asignado_a !== userId) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    res.json(mapDocument(doc));
  } catch (error) {
    console.error('Error en getDocumentById:', error);
    res.status(500).json({ error: 'Error al obtener documento' });
  }
};

export const updateDocument = async (req, res) => {
  try {
    const documentId = req.params.id;
    const userId = req.user.id;
    const role = req.user.rol;
    const data = req.body;

    // Verificar que el documento existe
    const { rows: docRows } = await pool.query('SELECT * FROM documentos WHERE id = $1', [documentId]);
    if (docRows.length === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    const doc = docRows[0];
    
    // Admin (1) y root (4) pueden editar cualquier documento. Otros (3) no.
    // Nota: El rol 2 suele ser otro tipo de usuario, si existe, puede que requiera permiso. 
    // Ajustar si es necesario.
    // Lookup IDs si vienen en la data como string
    let departamento_id = doc.departamento_id;
    if (data.departamento) {
      const depRes = await pool.query('SELECT id FROM departamentos WHERE nombre = $1', [data.departamento]);
      if (depRes.rows.length > 0) departamento_id = depRes.rows[0].id;
    }

    let tipo_doc_id = doc.tipo_doc_id;
    if (data.tipo) {
      const tipoRes = await pool.query('SELECT id FROM tipos_de_documentos WHERE nombre = $1', [data.tipo]);
      if (tipoRes.rows.length > 0) tipo_doc_id = tipoRes.rows[0].id;
    }

    let estado_id = doc.estado_id;
    if (data.estado) {
      const estRes = await pool.query('SELECT id FROM estados_documentos WHERE nombre = $1', [data.estado]);
      if (estRes.rows.length > 0) estado_id = estRes.rows[0].id;
    }

    let asignado_a = doc.asignado_a;
    let newAsignadoA = false;
    if (data.asignadoA !== undefined) {
      if (data.asignadoA === null || data.asignadoA === '') {
        asignado_a = null;
      } else {
        const asigRes = await pool.query('SELECT id FROM usuarios WHERE username = $1', [data.asignadoA]);
        if (asigRes.rows.length > 0) {
          if (asignado_a !== asigRes.rows[0].id) {
             asignado_a = asigRes.rows[0].id;
             newAsignadoA = true;
          }
        }
      }
    }

    // Manejar los nombres de los campos que vienen del frontend (mapeados en mapDocument)
    const serial_registro = data.nombre !== undefined ? data.nombre : doc.serial_registro;
    const descripcion = data.descripcion !== undefined ? data.descripcion : doc.descripcion;
    const remitente = data.remitente !== undefined ? data.remitente : doc.remitente;
    const urgencia = data.urgencia !== undefined ? data.urgencia : doc.urgencia;
    const direccion = data.direccion !== undefined ? data.direccion : doc.direccion;
    const destino = data.destino !== undefined ? data.destino : doc.destino;

    const { rows } = await pool.query(
      `UPDATE documentos 
       SET serial_registro = $1, remitente = $2, descripcion = $3, departamento_id = $4, 
           tipo_doc_id = $5, estado_id = $6, urgencia = $7,
           direccion = $8, destino = $9, asignado_a = $10,
           ultima_modificacion = CURRENT_TIMESTAMP
       WHERE id = $11 RETURNING *`,
      [
        serial_registro,
        remitente,
        descripcion,
        departamento_id,
        tipo_doc_id,
        estado_id,
        urgencia,
        direccion,
        destino,
        asignado_a,
        documentId
      ]
    );

    if (newAsignadoA && asignado_a) {
      await createNotification(asignado_a, documentId, urgencia, serial_registro);
    }

    // Devolvemos el documento actualizado con el mismo formato
    const { rows: updatedRows } = await pool.query(
      `SELECT 
        d.id,
        d.serial_registro,
        d.fecha_registro,
        d.remitente,
        d.descripcion,
        dep.nombre AS departamento,
        td.nombre AS tipo_documento,
        ed.nombre AS estado,
        d.urgencia,
        d.s3_key,
        d.s3_url_bucket,
        u_creador.username AS creado_por_username,
        u_asignado.username AS asignado_a_username,
        d.direccion,
        d.destino
      FROM documentos d
      INNER JOIN departamentos dep ON d.departamento_id = dep.id
      INNER JOIN tipos_de_documentos td ON d.tipo_doc_id = td.id
      INNER JOIN estados_documentos ed ON d.estado_id = ed.id
      INNER JOIN usuarios u_creador ON d.creado_por = u_creador.id
      LEFT JOIN usuarios u_asignado ON d.asignado_a = u_asignado.id
      WHERE d.id = $1`,
      [documentId]
    );

    res.json(mapDocument(updatedRows[0]));
  } catch (error) {
    console.error('Error en updateDocument:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Error: El serial de registro ingresado ya existe en otro documento.' });
    }
    res.status(500).json({ error: 'Error al actualizar documento' });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const documentId = req.params.id;
    const role = req.user.rol;

    // Solo administradores y root pueden eliminar
    if (role !== 1 && role !== 4) {
      return res.status(403).json({ error: 'No autorizado para eliminar documentos' });
    }

    const { rowCount } = await pool.query('DELETE FROM documentos WHERE id = $1', [documentId]);
    if (rowCount === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    res.json({ message: 'Documento eliminado correctamente' });
  } catch (error) {
    console.error('Error en deleteDocument:', error);
    res.status(500).json({ error: 'Error al eliminar documento' });
  }
};

export const downloadDocument = async (req, res) => {
  try {
    const documentId = req.params.id;
    const userId = req.user.id;
    const role = req.user.rol;

    const { rows } = await pool.query(
      `SELECT s3_url_bucket, s3_key, creado_por, asignado_a FROM documentos WHERE id = $1`,
      [documentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    const doc = rows[0];

    // Verificar acceso
    if (role === 3 && doc.asignado_a !== userId) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Si tenemos un s3_url_bucket, redirigimos; si no, intentamos con s3_key
    if (doc.s3_url_bucket) {
      return res.redirect(doc.s3_url_bucket);
    }

    // Aquí podrías generar una URL firmada de S3 usando s3_key
    // Por ahora, enviamos un enlace temporal de ejemplo
    res.json({ url: `https://s3.amazonaws.com/bucket/${doc.s3_key}` });
  } catch (error) {
    console.error('Error en downloadDocument:', error);
    res.status(500).json({ error: 'Error al descargar documento' });
  }
};

export const uploadFileToDocument = [
  upload.single('file'),   // el campo del formulario se llama "file"
  async (req, res) => {
    try {
      const { id } = req.params;
      const file = req.file;
      if (!file) return res.status(400).json({ error: 'No se envió ningún archivo' });

      // Verificar que el documento existe y permisos
      const { rows: docRows } = await pool.query('SELECT id, s3_key FROM documentos WHERE id = $1', [id]);
      if (docRows.length === 0) return res.status(404).json({ error: 'Documento no encontrado' });

      // Leer el array actual de archivos (guardado como JSON en s3_key)
      const archivos = JSON.parse(docRows[0].s3_key || '[]');
      // Añadimos solo el nombre del archivo (sin ruta) para referencia
      archivos.push(file.filename);

      await pool.query(
        `UPDATE documentos SET s3_key = $1, ultima_modificacion = CURRENT_TIMESTAMP WHERE id = $2`,
        [JSON.stringify(archivos), id]
      );

      res.json({ message: 'Archivo subido', filename: file.filename });
    } catch (error) {
      console.error('Error al subir archivo:', error);
      res.status(500).json({ error: 'Error al subir archivo' });
    }
  }
];

export const downloadDocumentFile = async (req, res) => {
  try {
    const { id, filename } = req.params;

    // Verificar permisos de acceso (puedes reutilizar la lógica de getDocumentById)
    const { rows } = await pool.query(
      'SELECT s3_key, creado_por, asignado_a FROM documentos WHERE id = $1',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Documento no encontrado' });

    const doc = rows[0];
    const archivos = JSON.parse(doc.s3_key || '[]');

    // Comprobar que el filename pertenece a este documento
    if (!archivos.includes(filename)) {
      return res.status(404).json({ error: 'Archivo no encontrado en este documento' });
    }

    // Verificar autorización (si no es admin/root y el usuario no es creador ni asignado)
    if (req.user.rol === 3 && doc.creado_por !== req.user.id && doc.asignado_a !== req.user.id) {
      return res.status(403).json({ error: 'Acceso denegado' });
    }

    // Construir la ruta completa: carpeta uploads/
    const filePath = path.join(__dirname, '..', 'uploads', filename);

    // Verificar que el archivo existe físicamente
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Archivo físico no encontrado' });
    }

    // Enviar el archivo para descarga (usa el nombre original o el filename)
    res.download(filePath, filename);   // Content-Disposition: attachment
  } catch (error) {
    console.error('Error al descargar archivo:', error);
    res.status(500).json({ error: 'Error al descargar archivo' });
  }
};