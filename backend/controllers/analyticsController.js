const pool = require('../db/pool');
const { success, badRequest } = require('../lib/response');
const asyncHandler = require('../lib/asyncHandler');
const { whereBiller } = require('../middleware/tenantContext');

module.exports = {
  topProducts: asyncHandler(async (req, res) => {
    const { desde, hasta, limit = 20 } = req.query;
    const params = [];
    let dateFilter = '';
    if (desde) { params.push(desde); dateFilter += ` AND i.created_at >= $${params.length}`; }
    if (hasta) { params.push(hasta); dateFilter += ` AND i.created_at <= $${params.length}`; }

    let sql = `
      SELECT ii.code, ii.description,
        SUM(ii.quantity)::numeric AS total_qty,
        SUM(ii.total)::numeric AS total_value,
        COUNT(DISTINCT i.id)::int AS invoice_count,
        COUNT(DISTINCT i.client_name)::int AS client_count
      FROM invoice_items ii
      JOIN invoices i ON i.id = ii.invoice_id
      WHERE 1=1 ${dateFilter}
    `;
    sql += whereBiller(req, params, 'i');
    sql += ` GROUP BY ii.code, ii.description ORDER BY total_qty DESC LIMIT ${parseInt(limit) || 20}`;

    const { rows } = await pool.query(sql, params);
    success(res, rows);
  }),

  productClients: asyncHandler(async (req, res) => {
    const { code, desde, hasta } = req.query;
    if (!code) return badRequest(res, 'code is required');

    const params = [code];
    let dateFilter = '';
    if (desde) { params.push(desde); dateFilter += ` AND i.created_at >= $${params.length}`; }
    if (hasta) { params.push(hasta); dateFilter += ` AND i.created_at <= $${params.length}`; }

    let sql = `
      SELECT i.client_name, COUNT(*)::int AS order_count,
        SUM(ii.quantity)::numeric AS total_qty,
        SUM(ii.total)::numeric AS total_value,
        MIN(i.created_at) AS first_date,
        MAX(i.created_at) AS last_date
      FROM invoice_items ii
      JOIN invoices i ON i.id = ii.invoice_id
      WHERE ii.code = $1 ${dateFilter}
    `;
    sql += whereBiller(req, params, 'i');
    sql += ` GROUP BY i.client_name ORDER BY total_qty DESC`;

    const { rows } = await pool.query(sql, params);
    success(res, rows);
  }),

  monthlySales: asyncHandler(async (req, res) => {
    const { code, client, year } = req.query;
    const params = [];
    let filters = '';

    if (code) { params.push(code); filters += ` AND ii.code = $${params.length}`; }
    if (client) { params.push(`%${client}%`); filters += ` AND i.client_name ILIKE $${params.length}`; }
    if (year) { params.push(parseInt(year)); filters += ` AND EXTRACT(YEAR FROM i.created_at) = $${params.length}`; }

    let sql = `
      SELECT EXTRACT(YEAR FROM i.created_at)::int AS year,
        EXTRACT(MONTH FROM i.created_at)::int AS month,
        TO_CHAR(i.created_at, 'YYYY-MM') AS period,
        COUNT(DISTINCT i.id)::int AS invoice_count,
        SUM(ii.quantity)::numeric AS total_qty,
        SUM(ii.total)::numeric AS total_value
      FROM invoice_items ii
      JOIN invoices i ON i.id = ii.invoice_id
      WHERE 1=1 ${filters}
    `;
    sql += whereBiller(req, params, 'i');
    sql += ` GROUP BY year, month, period ORDER BY year DESC, month DESC`;

    const { rows } = await pool.query(sql, params);
    success(res, rows);
  }),

  clientProducts: asyncHandler(async (req, res) => {
    const { client, desde, hasta } = req.query;
    if (!client) return badRequest(res, 'client is required');

    const params = [`%${client}%`];
    let dateFilter = '';
    if (desde) { params.push(desde); dateFilter += ` AND i.created_at >= $${params.length}`; }
    if (hasta) { params.push(hasta); dateFilter += ` AND i.created_at <= $${params.length}`; }

    let sql = `
      SELECT ii.code, ii.description,
        SUM(ii.quantity)::numeric AS total_qty,
        SUM(ii.total)::numeric AS total_value,
        COUNT(*)::int AS order_count
      FROM invoice_items ii
      JOIN invoices i ON i.id = ii.invoice_id
      WHERE i.client_name ILIKE $1 ${dateFilter}
    `;
    sql += whereBiller(req, params, 'i');
    sql += ` GROUP BY ii.code, ii.description ORDER BY total_qty DESC`;

    const { rows } = await pool.query(sql, params);
    success(res, rows);
  }),

  productRelations: asyncHandler(async (req, res) => {
    const { code, limit = 10 } = req.query;
    if (!code) return badRequest(res, 'code is required');

    const params = [code];
    let sql = `
      SELECT paired.code, paired.description,
        COUNT(*)::int AS together_count,
        SUM(paired.total_qty)::numeric AS total_qty
      FROM invoice_items ii
      JOIN invoices i ON i.id = ii.invoice_id
      JOIN LATERAL (
        SELECT iip.code, iip.description,
          SUM(iip.quantity) AS total_qty
        FROM invoice_items iip
        WHERE iip.invoice_id = i.id AND iip.code != $1
        GROUP BY iip.code, iip.description
      ) paired ON true
      WHERE ii.code = $1
      GROUP BY paired.code, paired.description
      ORDER BY together_count DESC
      LIMIT ${parseInt(limit) || 10}
    `;

    const { rows } = await pool.query(sql, params);
    success(res, rows);
  }),

  stats: asyncHandler(async (req, res) => {
    const params = [];
    let sql = `
      SELECT COUNT(DISTINCT ii.code)::int AS total_products,
        COUNT(DISTINCT i.id)::int AS invoices_with_items,
        COUNT(ii.id)::int AS total_line_items,
        COALESCE(SUM(ii.total), 0)::numeric AS total_value,
        COALESCE(SUM(ii.quantity), 0)::numeric AS total_qty
      FROM invoice_items ii
      JOIN invoices i ON i.id = ii.invoice_id
      WHERE 1=1
    `;
    sql += whereBiller(req, params, 'i');
    const { rows } = await pool.query(sql, params);
    success(res, rows[0]);
  }),
};
