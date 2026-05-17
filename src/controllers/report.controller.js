// controllers/report.controller.js
import { pool } from "../db.js";

/**
 * GET /api/reports/stats
 * Returns aggregated document statistics with optional filters.
 *
 * Query params (all optional):
 *   - direccion: 'entrada' | 'salida'
 *   - estado: nombre del estado (e.g. 'Recibido', 'Firmado')
 *   - destino: string parcial (ILIKE match)
 *   - dateFrom: ISO date string (inclusive)
 *   - dateTo:   ISO date string (inclusive)
 */
export const getReportStats = async (req, res) => {
  try {
    const { direccion, estado, destino, dateFrom, dateTo } = req.query;

    // ── Build dynamic WHERE clause ──────────────────────────────
    const conditions = [];
    const params = [];

    if (direccion && (direccion === 'entrada' || direccion === 'salida')) {
      params.push(direccion);
      conditions.push(`d.direccion = $${params.length}`);
    }

    if (estado) {
      params.push(estado);
      conditions.push(`ed.nombre = $${params.length}`);
    }

    if (destino) {
      params.push(`%${destino}%`);
      conditions.push(`d.destino ILIKE $${params.length}`);
    }

    if (dateFrom) {
      params.push(dateFrom);
      conditions.push(`d.fecha_registro >= $${params.length}::timestamp`);
    }

    if (dateTo) {
      params.push(dateTo);
      conditions.push(`d.fecha_registro <= ($${params.length}::timestamp + interval '1 day')`);
    }

    const whereClause = conditions.length > 0
      ? 'WHERE ' + conditions.join(' AND ')
      : '';

    // Base FROM with necessary joins for filters
    const baseFrom = `
      FROM documentos d
      INNER JOIN estados_documentos ed ON d.estado_id = ed.id
      INNER JOIN departamentos dep ON d.departamento_id = dep.id
      INNER JOIN tipos_de_documentos td ON d.tipo_doc_id = td.id
    `;

    // ── 1. Total documents ──────────────────────────────────────
    const totalRes = await pool.query(
      `SELECT COUNT(*)::int AS total ${baseFrom} ${whereClause}`,
      params
    );
    const totalDocuments = totalRes.rows[0].total;

    // ── 2. By status ────────────────────────────────────────────
    const byStatusRes = await pool.query(
      `SELECT ed.nombre AS name, COUNT(*)::int AS count
       ${baseFrom} ${whereClause}
       GROUP BY ed.nombre ORDER BY count DESC`,
      params
    );

    // ── 3. By department ────────────────────────────────────────
    const byDeptRes = await pool.query(
      `SELECT dep.nombre AS name, COUNT(*)::int AS count
       ${baseFrom} ${whereClause}
       GROUP BY dep.nombre ORDER BY count DESC`,
      params
    );

    // ── 4. By document type ─────────────────────────────────────
    const byTypeRes = await pool.query(
      `SELECT td.nombre AS name, COUNT(*)::int AS count
       ${baseFrom} ${whereClause}
       GROUP BY td.nombre ORDER BY count DESC`,
      params
    );

    // ── 5. By direction ─────────────────────────────────────────
    const byDirRes = await pool.query(
      `SELECT
         COALESCE(SUM(CASE WHEN d.direccion = 'entrada' THEN 1 ELSE 0 END), 0)::int AS entrada,
         COALESCE(SUM(CASE WHEN d.direccion = 'salida'  THEN 1 ELSE 0 END), 0)::int AS salida
       ${baseFrom} ${whereClause}`,
      params
    );

    // ── 6. By urgency ───────────────────────────────────────────
    const byUrgRes = await pool.query(
      `SELECT COALESCE(d.urgencia, 'Sin Urgencia') AS name, COUNT(*)::int AS count
       ${baseFrom} ${whereClause}
       GROUP BY d.urgencia ORDER BY count DESC`,
      params
    );

    // ── 7. Timeline (documents per day, last 30 days or filtered range)
    const timelineRes = await pool.query(
      `SELECT d.fecha_registro::date AS date, COUNT(*)::int AS count
       ${baseFrom} ${whereClause}
       GROUP BY d.fecha_registro::date
       ORDER BY date ASC`,
      params
    );

    // ── 8. Average documents per day ────────────────────────────
    let avgDocsPerDay = 0;
    if (timelineRes.rows.length > 0) {
      const totalInTimeline = timelineRes.rows.reduce((sum, r) => sum + r.count, 0);
      const days = timelineRes.rows.length;
      avgDocsPerDay = parseFloat((totalInTimeline / days).toFixed(1));
    }

    // ── 9. Recent activity (last 5 documents) ───────────────────
    const recentRes = await pool.query(
      `SELECT d.serial_registro, d.remitente, d.descripcion,
              d.fecha_registro, ed.nombre AS estado, d.direccion
       ${baseFrom} ${whereClause}
       ORDER BY d.fecha_registro DESC LIMIT 5`,
      params
    );

    res.json({
      totalDocuments,
      avgDocsPerDay,
      byStatus: byStatusRes.rows,
      byDepartment: byDeptRes.rows,
      byType: byTypeRes.rows,
      byDirection: byDirRes.rows[0] || { entrada: 0, salida: 0 },
      byUrgency: byUrgRes.rows,
      timeline: timelineRes.rows,
      recentActivity: recentRes.rows,
    });
  } catch (error) {
    console.error('Error en getReportStats:', error);
    res.status(500).json({ error: 'Error al generar reporte de estadísticas' });
  }
};
