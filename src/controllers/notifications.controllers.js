import { pool } from "../db.js";
import { authenticateToken } from "./auth.middleware.js";

const buildNotificationMessage = (urgencia, serial) => {
  if (urgencia === 'alta' || urgencia === 'Alta' || urgencia === 'ALTA') {
    return `⚠️ ALERTA: Se le ha asignado un documento de ALTA URGENCIA: ${serial}`;
  } else if (urgencia === 'media' || urgencia === 'Media' || urgencia === 'MEDIA') {
    return `📋 Se le ha asignado un documento de urgencia media: ${serial}`;
  }
  return `📄 Nuevo documento asignado: ${serial}`;
};

export const createNotification = async (usuarioId, documentoId, urgencia, serial) => {
  const mensaje = buildNotificationMessage(urgencia, serial);
  await pool.query(
    'INSERT INTO notificaciones (usuario_id, documento_id, urgencia, mensaje) VALUES ($1, $2, $3, $4)',
    [usuarioId, documentoId, urgencia || null, mensaje]
  );
};

export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { rows } = await pool.query(
      `SELECT 
        n.id, n.leida, n.urgencia, n.mensaje, n.created_at,
        d.id AS documento_id,
        d.serial_registro,
        d.descripcion,
        d.direccion,
        d.s3_key,
        dep.nombre AS departamento,
        td.nombre AS tipo_documento,
        ed.nombre AS estado,
        d.urgencia AS doc_urgencia,
        d.remitente,
        u_creador.username AS creado_por_username,
        u_asignado.username AS asignado_a_username
      FROM notificaciones n
      INNER JOIN documentos d ON n.documento_id = d.id
      LEFT JOIN departamentos dep ON d.departamento_id = dep.id
      LEFT JOIN tipos_de_documentos td ON d.tipo_doc_id = td.id
      LEFT JOIN estados_documentos ed ON d.estado_id = ed.id
      LEFT JOIN usuarios u_creador ON d.creado_por = u_creador.id
      LEFT JOIN usuarios u_asignado ON d.asignado_a = u_asignado.id
      WHERE n.usuario_id = $1
      ORDER BY n.created_at DESC`,
      [userId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Error en getNotifications:', error);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const { rows } = await pool.query(
      'SELECT COUNT(*) AS count FROM notificaciones WHERE usuario_id = $1 AND leida = FALSE',
      [userId]
    );
    res.json({ count: parseInt(rows[0].count, 10) });
  } catch (error) {
    console.error('Error en getUnreadCount:', error);
    res.status(500).json({ error: 'Error al obtener conteo' });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    await pool.query(
      'UPDATE notificaciones SET leida = TRUE WHERE id = $1 AND usuario_id = $2',
      [id, userId]
    );
    res.json({ message: 'Notificación marcada como leída' });
  } catch (error) {
    console.error('Error en markAsRead:', error);
    res.status(500).json({ error: 'Error al marcar notificación' });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    await pool.query(
      'UPDATE notificaciones SET leida = TRUE WHERE usuario_id = $1',
      [userId]
    );
    res.json({ message: 'Todas las notificaciones marcadas como leídas' });
  } catch (error) {
    console.error('Error en markAllAsRead:', error);
    res.status(500).json({ error: 'Error al marcar notificaciones' });
  }
};

export const deleteReadNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { rowCount } = await pool.query(
      'DELETE FROM notificaciones WHERE usuario_id = $1 AND leida = TRUE',
      [userId]
    );
    res.json({ message: `${rowCount} notificaciones leídas eliminadas` });
  } catch (error) {
    console.error('Error en deleteReadNotifications:', error);
    res.status(500).json({ error: 'Error al eliminar notificaciones leídas' });
  }
};
