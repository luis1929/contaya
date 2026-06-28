const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { success, created, badRequest, notFound, error } = require('../lib/response');
const asyncHandler = require('../lib/asyncHandler');

module.exports = {
  dashboard: asyncHandler(async (req, res) => {
    const [billers, invoices, documents, users] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS total, COALESCE(SUM(CASE WHEN is_active THEN 1 ELSE 0 END), 0)::int AS active FROM billers'),
      pool.query('SELECT COUNT(*)::int AS total, COALESCE(SUM(total), 0) AS total_sum, COALESCE(SUM(total) * 0.19, 0) AS total_iva FROM invoices'),
      pool.query('SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE workflow_status = \'pending\')::int AS pending FROM documents'),
      pool.query('SELECT COUNT(*)::int AS total FROM users'),
    ]);

    const activity = await pool.query('SELECT * FROM audit_log ORDER BY created_at DESC LIMIT 20');
    const topBillers = await pool.query(`
      SELECT b.id, b.name, b.document_number, COUNT(i.id)::int AS invoice_count, COALESCE(SUM(i.total), 0) AS total_sum
      FROM billers b LEFT JOIN invoices i ON i.biller_id = b.id
      GROUP BY b.id ORDER BY invoice_count DESC LIMIT 5
    `);

    success(res, {
      stats: { billers: billers.rows[0], invoices: invoices.rows[0], documents: documents.rows[0], users: users.rows[0] },
      activity: activity.rows,
      topBillers: topBillers.rows,
    });
  }),

  listBillers: asyncHandler(async (req, res) => {
    const { search, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = 'WHERE 1=1';
    if (search) { params.push(`%${search}%`); where += ` AND (b.name ILIKE $${params.length} OR b.document_number ILIKE $${params.length})`; }
    if (status === 'active') where += ' AND b.is_active = true';
    if (status === 'inactive') where += ' AND b.is_active = false';

    const countResult = await pool.query(`SELECT COUNT(*) FROM billers b ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    const { rows } = await pool.query(`
      SELECT b.*, COUNT(i.id)::int AS invoice_count, COALESCE(SUM(i.total), 0) AS total_sum, MAX(i.created_at) AS last_invoice_date,
        COALESCE(bc.is_configured, false) AS credentials_configured
      FROM billers b
      LEFT JOIN invoices i ON i.biller_id = b.id
      LEFT JOIN biller_credentials bc ON bc.biller_id = b.id
      ${where} GROUP BY b.id, bc.is_configured ORDER BY b.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, limit, offset]);

    success(res, { data: rows, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  }),

  createBiller: asyncHandler(async (req, res) => {
    const { name, document_type, document_number, email, phone, address, city, password } = req.body;
    if (!name || !document_number) return badRequest(res, 'Nombre y NIT requeridos');
    const hash = password ? await bcrypt.hash(password, 10) : null;
    const { rows } = await pool.query(
      'INSERT INTO billers (name, document_type, document_number, email, phone, address, city, password) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *',
      [name, document_type || 'NIT', document_number, email, phone, address, city, hash]
    );
    await pool.query(
      'INSERT INTO audit_log (actor_id, actor_name, actor_role, action, resource, resource_id, details) VALUES ($1, $2, $3, \'create\', \'billers\', $4, $5)',
      [req.user.id, req.user.email, 'admin', rows[0].id, JSON.stringify({ name, document_number })]
    );
    created(res, rows[0]);
  }),

  updateBiller: asyncHandler(async (req, res) => {
    const fields = ['name', 'document_type', 'document_number', 'email', 'phone', 'address', 'city', 'is_active'];
    const sets = [];
    const params = [];
    let idx = 0;
    for (const f of fields) {
      if (req.body[f] !== undefined) { idx++; sets.push(`${f}=$${idx}`); params.push(req.body[f]); }
    }
    if (req.body.password) { idx++; sets.push(`password=$${idx}`); params.push(await bcrypt.hash(req.body.password, 10)); }
    if (!sets.length) return badRequest(res, 'No hay campos para actualizar');
    sets.push('updated_at=NOW()');
    idx++;
    params.push(req.params.id);
    const { rows } = await pool.query(`UPDATE billers SET ${sets.join(', ')} WHERE id=$${idx} RETURNING *`, params);
    if (!rows.length) return notFound(res, 'Facturador no encontrado');
    await pool.query(
      'INSERT INTO audit_log (actor_id, actor_name, actor_role, action, resource, resource_id, details) VALUES ($1, $2, $3, \'update\', \'billers\', $4, $5)',
      [req.user.id, req.user.email, 'admin', rows[0].id, JSON.stringify(req.body)]
    );
    success(res, rows[0]);
  }),

  deleteBiller: asyncHandler(async (req, res) => {
    const { rowCount } = await pool.query('DELETE FROM billers WHERE id = $1', [req.params.id]);
    if (!rowCount) return notFound(res);
    await pool.query(
      'INSERT INTO audit_log (actor_id, actor_name, actor_role, action, resource, resource_id) VALUES ($1, $2, $3, \'delete\', \'billers\', $4)',
      [req.user.id, req.user.email, 'admin', req.params.id]
    );
    success(res, { message: 'Facturador eliminado' });
  }),

  auditLog: asyncHandler(async (req, res) => {
    const { page = 1, limit = 50, action, resource, actor_role, desde, hasta, search } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = 'WHERE 1=1';
    let idx = 0;

    if (action) { idx++; params.push(action); where += ` AND action = $${idx}`; }
    if (resource) { idx++; params.push(resource); where += ` AND resource = $${idx}`; }
    if (actor_role) { idx++; params.push(actor_role); where += ` AND actor_role = $${idx}`; }
    if (desde) { idx++; params.push(desde); where += ` AND created_at >= $${idx}`; }
    if (hasta) { idx++; params.push(hasta); where += ` AND created_at <= $${idx}`; }
    if (search) { idx++; params.push(`%${search}%`); where += ` AND (actor_name ILIKE $${idx} OR resource_id::text ILIKE $${idx} OR details::text ILIKE $${idx})`; }

    const countResult = await pool.query(`SELECT COUNT(*) FROM audit_log ${where}`, params);
    const total = parseInt(countResult.rows[0].count);

    idx++; params.push(limit);
    idx++; params.push(offset);
    const { rows } = await pool.query(
      `SELECT * FROM audit_log ${where} ORDER BY created_at DESC LIMIT $${idx - 1} OFFSET $${idx}`,
      params
    );

    success(res, { data: rows, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  }),

  auditStats: asyncHandler(async (req, res) => {
    const { rows: actionCounts } = await pool.query(`
      SELECT action, COUNT(*)::int AS count FROM audit_log GROUP BY action ORDER BY count DESC
    `);
    const { rows: resourceCounts } = await pool.query(`
      SELECT resource, COUNT(*)::int AS count FROM audit_log WHERE resource IS NOT NULL GROUP BY resource ORDER BY count DESC
    `);
    const { rows: dailyActivity } = await pool.query(`
      SELECT DATE(created_at) AS date, COUNT(*)::int AS count FROM audit_log
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(created_at) ORDER BY date DESC
    `);
    const { rows: roleCounts } = await pool.query(`
      SELECT actor_role, COUNT(*)::int AS count FROM audit_log WHERE actor_role IS NOT NULL GROUP BY actor_role
    `);
    const { rows: totalRow } = await pool.query('SELECT COUNT(*)::int AS total, COUNT(DISTINCT actor_id)::int AS unique_actors FROM audit_log');

    success(res, {
      total: totalRow[0],
      byAction: actionCounts,
      byResource: resourceCounts,
      byRole: roleCounts,
      daily: dailyActivity,
    });
  }),

  getSettings: asyncHandler(async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM system_settings ORDER BY key');
    const settings = {};
    for (const r of rows) settings[r.key] = r.value;
    success(res, settings);
  }),

  updateSetting: asyncHandler(async (req, res) => {
    const { key, value } = req.body;
    if (!key) return badRequest(res, 'key requerido');
    await pool.query(
      'INSERT INTO system_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()',
      [key, value]
    );
    await pool.query(
      'INSERT INTO audit_log (actor_id, actor_name, actor_role, action, resource, resource_id, details) VALUES ($1, $2, $3, \'update\', \'settings\', $4, $5)',
      [req.user.id, req.user.email, 'admin', key, JSON.stringify({ value })]
    );
    success(res, { key, value });
  }),
};
