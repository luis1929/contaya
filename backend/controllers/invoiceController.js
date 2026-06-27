const pool = require('../db/pool');
const { success, created, badRequest, notFound, error } = require('../lib/response');
const asyncHandler = require('../lib/asyncHandler');
const { whereBiller } = require('../middleware/tenantContext');

function adjTotal(col = 'total') {
  return `CASE WHEN doc_type IN ('NCR') THEN -${col} ELSE ${col} END`;
}

module.exports = {
  list: asyncHandler(async (req, res) => {
    const { desde, hasta, cliente, estatus, facturador } = req.query;
    let sql = 'SELECT i.*, b.name AS biller_name FROM invoices i LEFT JOIN billers b ON i.biller_id = b.id WHERE 1=1';
    const params = [];
    if (desde) { params.push(desde); sql += ` AND i.created_at >= $${params.length}`; }
    if (hasta) { params.push(hasta); sql += ` AND i.created_at <= $${params.length}`; }
    if (cliente) { params.push(`%${cliente}%`); sql += ` AND (i.client_name ILIKE $${params.length} OR i.client ILIKE $${params.length})`; }
    if (estatus) { params.push(estatus); sql += ` AND i.status = $${params.length}`; }
    if (facturador) { params.push(facturador); sql += ` AND i.biller_id = $${params.length}::uuid`; }
    sql += whereBiller(req, params, 'i');
    sql += ' ORDER BY i.created_at DESC NULLS LAST';
    const { rows } = await pool.query(sql, params);
    success(res, rows);
  }),

  summary: asyncHandler(async (req, res) => {
    const { desde, hasta, facturador } = req.query;
    let sql = `SELECT COUNT(*) AS total_count, COALESCE(SUM(${adjTotal()}), 0) AS total_sum,
      COALESCE(SUM(${adjTotal()}) * 0.19, 0) AS iva_sum, AVG(${adjTotal()}) AS total_avg,
      MIN(created_at) AS first_date, MAX(created_at) AS last_date,
      COUNT(*) FILTER (WHERE paid = true) AS paid_count,
      COALESCE(SUM(${adjTotal()}) FILTER (WHERE paid = true), 0) AS paid_sum
      FROM invoices WHERE 1=1`;
    const params = [];
    if (desde) { params.push(desde); sql += ` AND created_at >= $${params.length}`; }
    if (hasta) { params.push(hasta); sql += ` AND created_at <= $${params.length}`; }
    if (facturador) { params.push(facturador); sql += ` AND biller_id = $${params.length}::uuid`; }
    sql += whereBiller(req, params);
    const { rows } = await pool.query(sql, params);
    success(res, rows[0]);
  }),

  summaryByBiller: asyncHandler(async (req, res) => {
    const { desde, hasta } = req.query;
    let sql = `SELECT biller_id, COUNT(*) AS total_count, COALESCE(SUM(${adjTotal()}), 0) AS total_sum
               FROM invoices WHERE biller_id IS NOT NULL`;
    const params = [];
    if (desde) { params.push(desde); sql += ` AND created_at >= $${params.length}`; }
    if (hasta) { params.push(hasta); sql += ` AND created_at <= $${params.length}`; }
    sql += whereBiller(req, params);
    sql += ' GROUP BY biller_id';
    const { rows } = await pool.query(sql, params);
    success(res, rows);
  }),

  clientsByBiller: asyncHandler(async (req, res) => {
    let billerId = req.query.biller_id;
    if (!req.isAdmin) billerId = req.billerId;
    if (!billerId) return badRequest(res, 'biller_id required');
    const { rows } = await pool.query(`
      SELECT COALESCE(client_name, 'Sin nombre') AS name, COUNT(*)::int AS invoice_count,
        SUM(${adjTotal()}) AS total_sum, MIN(created_at) AS first_date, MAX(created_at) AS last_date
      FROM invoices WHERE biller_id = $1::uuid AND client_name IS NOT NULL
      GROUP BY client_name ORDER BY COUNT(*) DESC
    `, [billerId]);
    success(res, rows);
  }),

  create: asyncHandler(async (req, res) => {
    const { client_name, client_id, ncf, doc_type, total, paid, status, items, raw_data } = req.body;
    if (!client_name) return badRequest(res, 'client_name es requerido');
    const bid = req.isAdmin ? (req.body.biller_id || req.billerId) : req.billerId;
    if (!bid) return badRequest(res, 'biller_id es requerido');
    const { rows } = await pool.query(
      `INSERT INTO invoices (biller_id, client_id, client_name, ncf, doc_type, total, paid, status, raw_data)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [bid, client_id || null, client_name, ncf || null, doc_type || null, total || 0, paid || false, status || 'pending',
       raw_data ? JSON.stringify(raw_data) : null]
    );
    if (items && items.length) {
      for (const item of items) {
        await pool.query(
          'INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount) VALUES ($1,$2,$3,$4,$5)',
          [rows[0].id, item.description, item.quantity || 1, item.unit_price || 0, item.amount || 0]
        );
      }
    }
    created(res, rows[0]);
  }),

  update: asyncHandler(async (req, res) => {
    const { client_name, client_id, ncf, doc_type, total, paid, status, items, raw_data } = req.body;
    let sql = 'UPDATE invoices SET client_name=$1, client_id=$2, ncf=$3, doc_type=$4, total=$5, paid=$6, status=$7, raw_data=$8, updated_at=NOW() WHERE id=$9';
    const params = [client_name, client_id || null, ncf || null, doc_type || null, total || 0,
      paid || false, status || 'pending', raw_data ? JSON.stringify(raw_data) : null, req.params.id];
    if (!req.isAdmin) { sql += ` AND biller_id = $${params.length + 1}::uuid`; params.push(req.billerId); }
    const { rowCount } = await pool.query(sql, params);
    if (!rowCount) return notFound(res);
    if (items) {
      await pool.query('DELETE FROM invoice_items WHERE invoice_id = $1', [req.params.id]);
      for (const item of items) {
        await pool.query(
          'INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount) VALUES ($1,$2,$3,$4,$5)',
          [req.params.id, item.description, item.quantity || 1, item.unit_price || 0, item.amount || 0]
        );
      }
    }
    const { rows } = await pool.query('SELECT * FROM invoices WHERE id = $1', [req.params.id]);
    success(res, rows[0]);
  }),

  remove: asyncHandler(async (req, res) => {
    let sql = 'DELETE FROM invoices WHERE id = $1';
    const params = [req.params.id];
    if (!req.isAdmin) { sql += ` AND biller_id = $${params.length + 1}::uuid`; params.push(req.billerId); }
    const { rowCount } = await pool.query(sql, params);
    if (!rowCount) return notFound(res);
    success(res, { message: 'Deleted' });
  }),

  consolidated: asyncHandler(async (req, res) => {
    let billerId = req.query.biller_id;
    if (!req.isAdmin) billerId = req.billerId;
    if (!billerId) return badRequest(res, 'biller_id required');
    const { rows } = await pool.query(`
      SELECT EXTRACT(YEAR FROM created_at)::int AS year, COALESCE(client_name, 'Sin nombre') AS client_name,
        COUNT(*)::int AS invoice_count, SUM(${adjTotal()}) AS total_sum
      FROM invoices WHERE biller_id = $1::uuid AND client_name IS NOT NULL
      GROUP BY year, client_name ORDER BY year DESC, SUM(${adjTotal()}) DESC
    `, [billerId]);
    success(res, rows);
  }),
};
