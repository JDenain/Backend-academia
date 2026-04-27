// controllers/documents.controllers.js
import { pool } from "../db.js";

// Helper para mapear la fila al formato que espera el frontend
const mapDocument = (row) => ({
  id: row.id, // "Id_Unico" original, ahora usamos el alias simple "id"
  nombre: row.serial_registro, // o podrías usar un campo 'nombre_archivo' si existiera
  descripcion: row.descripcion,
  tipo: row.tipo_documento,   // OFICIO, MEMORANDUM...
  fechaCreacion: row.fecha_registro,
  tamano: row.tamano || 0,    // por ahora 0; podrías almacenar el tamaño real en otra columna
  url: row.s3_url_bucket || '',
  usuarioSubio: row.creado_por_username,
  // Campos adicionales que podrías necesitar en modales:
  remitente: row.remitente,
  estado: row.estado,
  urgencia: row.urgencia,
  asignadoA: row.asignado_a_username,
  departamento: row.departamento
});

export const getDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.rol; // Asumimos que el middleware agrega req.user con {id, rol}

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
        d.asignado_a
      FROM documentos d
      INNER JOIN departamentos dep ON d.departamento_id = dep.id
      INNER JOIN tipos_de_documentos td ON d.tipo_doc_id = td.id
      INNER JOIN estados_documentos ed ON d.estado_id = ed.id
      INNER JOIN usuarios u_creador ON d.creado_por = u_creador.id
      LEFT JOIN usuarios u_asignado ON d.asignado_a = u_asignado.id
    `;

    const params = [];

    // Filtrado por rol: Admin/root ven todo; otros solo sus documentos (creados o asignados)
    if (role !== 'Administrador' && role !== 'root') {
      query += ` WHERE d.creado_por = $1 OR d.asignado_a = $1`;
      params.push(userId);
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
    const data = req.body;
    const { rows } = await pool.query(
      `INSERT INTO documentos 
       (serial_registro, remitente, descripcion, departamento_id, tipo_doc_id, estado_id, urgencia, s3_key, s3_url_bucket, creado_por, asignado_a)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        data.serial_registro,
        data.remitente,
        data.descripcion,
        data.departamento_id,
        data.tipo_doc_id,
        data.estado_id,
        data.urgencia,
        data.s3_key,
        data.s3_url_bucket,
        data.creado_por,
        data.asignado_a
      ]
    );
    res.status(201).json(mapDocument(rows[0]));
  } catch (error) {
    console.error('Error creando documento:', error);
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
        d.asignado_a
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
    if (role !== 'Administrador' && role !== 'root') {
      if (doc.creado_por !== userId && doc.asignado_a !== userId) {
        return res.status(403).json({ error: 'Acceso denegado' });
      }
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

    // Verificar que el documento existe y que el usuario tiene permiso
    const { rows: docRows } = await pool.query('SELECT creado_por, asignado_a FROM documentos WHERE id = $1', [documentId]);
    if (docRows.length === 0) {
      return res.status(404).json({ error: 'Documento no encontrado' });
    }

    const doc = docRows[0];
    // Admin y root pueden editar cualquier documento; otros solo si son creador o asignado
    if (role !== 'Administrador' && role !== 'root') {
      if (doc.creado_por !== userId && doc.asignado_a !== userId) {
        return res.status(403).json({ error: 'No tiene permiso para editar este documento' });
      }
    }

    const { rows } = await pool.query(
      `UPDATE documentos 
       SET serial_registro = $1, remitente = $2, descripcion = $3, departamento_id = $4, 
           tipo_doc_id = $5, estado_id = $6, urgencia = $7, s3_key = $8, 
           s3_url_bucket = $9, creado_por = $10, asignado_a = $11,
           ultima_modificacion = CURRENT_TIMESTAMP
       WHERE id = $12 RETURNING *`,
      [
        data.serial_registro,
        data.remitente,
        data.descripcion,
        data.departamento_id,
        data.tipo_doc_id,
        data.estado_id,
        data.urgencia,
        data.s3_key,
        data.s3_url_bucket,
        data.creado_por,
        data.asignado_a,
        documentId
      ]
    );

    // Devolvemos el documento actualizado con el mismo formato
    // (podemos reutilizar la función mapDocument pero necesitamos los joins; hacemos una segunda consulta)
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
        u_asignado.username AS asignado_a_username
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
    res.status(500).json({ error: 'Error al actualizar documento' });
  }
};

export const deleteDocument = async (req, res) => {
  try {
    const documentId = req.params.id;
    const role = req.user.rol;

    // Solo administradores y root pueden eliminar
    if (role !== 'Administrador' && role !== 'root') {
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
    if (role !== 'Administrador' && role !== 'root') {
      if (doc.creado_por !== userId && doc.asignado_a !== userId) {
        return res.status(403).json({ error: 'Acceso denegado' });
      }
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

