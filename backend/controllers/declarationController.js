const pool = require('../db/pool');
const { success, created, badRequest, notFound, error } = require('../lib/response');
const asyncHandler = require('../lib/asyncHandler');
const { whereBiller } = require('../middleware/tenantContext');

module.exports = {
  list: asyncHandler(async (req, res) => {
    const params = [];
    let where = whereBiller(req, params);
    if (!where) where = ' WHERE 1=1';

    const { rows: invoices } = await pool.query(`
      SELECT EXTRACT(YEAR FROM created_at)::int AS year, EXTRACT(MONTH FROM created_at)::int AS month,
        COALESCE(doc_type, 'FCF') AS doc_type,
        SUM(CASE WHEN doc_type IN ('NCR') THEN -total ELSE total END) AS total_sum,
        COUNT(*)::int AS invoice_count
      FROM invoices ${where}
      GROUP BY year, month, doc_type ORDER BY year DESC, month DESC
    `, params);

    const { rows: declarations } = await pool.query(`
      SELECT d.* FROM declarations d
      ${where.replace('WHERE', 'WHERE d.biller_id IS NOT NULL AND')}
      ORDER BY d.year DESC, d.month DESC
    `, params.length ? params : []);

    const monthlyMap = {};
    for (const inv of invoices) {
      const key = `${inv.year}-${String(inv.month).padStart(2, '0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { year: inv.year, month: inv.month, iva_base: 0, renta_base: 0, ica_base: 0, retencion_base: 0, invoice_count: 0 };
      monthlyMap[key].invoice_count += inv.invoice_count;
      const taxable = inv.doc_type === 'FCF' || inv.doc_type === 'CE' || inv.doc_type === 'NCF';
      if (taxable) {
        monthlyMap[key].iva_base += Number(inv.total_sum);
        monthlyMap[key].renta_base += Number(inv.total_sum);
        monthlyMap[key].ica_base += Number(inv.total_sum);
        monthlyMap[key].retencion_base += Number(inv.total_sum);
      }
    }

    const result = Object.values(monthlyMap).map(m => {
      const submitted = declarations.filter(d => d.year === m.year && d.month === m.month);
      const findDecl = (type) => submitted.find(d => d.type === type);
      return {
        period: `${m.year}-${String(m.month).padStart(2, '0')}`,
        year: m.year, month: m.month, invoice_count: m.invoice_count,
        iva: { base: m.iva_base, tax: Math.round(m.iva_base * 0.19), status: findDecl('IVA')?.status || 'pending', submitted_date: findDecl('IVA')?.submitted_date || null, declaration_id: findDecl('IVA')?.id || null },
        renta: { base: m.renta_base, tax: Math.round(m.renta_base * 0.25), status: findDecl('Renta')?.status || 'pending', submitted_date: findDecl('Renta')?.submitted_date || null, declaration_id: findDecl('Renta')?.id || null },
        ica: { base: m.ica_base, tax: Math.round(m.ica_base * 0.01), status: findDecl('ICA')?.status || 'pending', submitted_date: findDecl('ICA')?.submitted_date || null, declaration_id: findDecl('ICA')?.id || null },
        retencion: { base: m.retencion_base, tax: Math.round(m.retencion_base * 0.11), status: findDecl('Retención')?.status || 'pending', submitted_date: findDecl('Retención')?.submitted_date || null, declaration_id: findDecl('Retención')?.id || null },
      };
    });

    success(res, result);
  }),

  summary: asyncHandler(async (req, res) => {
    const params = [];
    let where = whereBiller(req, params);
    if (!where) where = ' WHERE 1=1';

    const { rows } = await pool.query(`
      SELECT COUNT(DISTINCT CONCAT(EXTRACT(YEAR FROM created_at), '-', EXTRACT(MONTH FROM created_at)))::int AS total_periods,
        SUM(CASE WHEN doc_type IN ('NCR') THEN -total ELSE total END) AS total_base,
        SUM(CASE WHEN doc_type IN ('NCR') THEN -total ELSE total END) * 0.19 AS total_iva,
        SUM(CASE WHEN doc_type IN ('NCR') THEN -total ELSE total END) * 0.25 AS total_renta,
        COUNT(*)::int AS total_invoices
      FROM invoices ${where}
    `, params);

    const { rows: declCount } = await pool.query(`
      SELECT COUNT(*) FILTER (WHERE status = 'submitted')::int AS submitted,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
        COUNT(*) FILTER (WHERE status = 'overdue')::int AS overdue
      FROM declarations ${where.replace('WHERE', 'WHERE biller_id IS NOT NULL AND')}
    `, params.length ? params : []);

    success(res, { ...rows[0], declarations: declCount[0] });
  }),

  create: asyncHandler(async (req, res) => {
    const { type, year, month, status, notes } = req.body;
    if (!type || !year || !month) return badRequest(res, 'type, year y month son requeridos');
    const bid = req.isAdmin ? (req.body.biller_id || req.billerId) : req.billerId;
    const { rows } = await pool.query(
      'INSERT INTO declarations (biller_id, type, year, month, status, notes) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [bid, type, year, month, status || 'pending', notes || null]
    );
    created(res, rows[0]);
  }),

  update: asyncHandler(async (req, res) => {
    const { status, submitted_date, notes } = req.body;
    let sql = 'UPDATE declarations SET status=$1, submitted_date=$2, notes=$3, updated_at=NOW() WHERE id=$4';
    const params = [status, submitted_date || null, notes || null, req.params.id];
    if (!req.isAdmin) { sql += ` AND biller_id = $${params.length + 1}::uuid`; params.push(req.billerId); }
    const { rowCount } = await pool.query(sql, params);
    if (!rowCount) return notFound(res);
    const { rows } = await pool.query('SELECT * FROM declarations WHERE id = $1', [req.params.id]);
    success(res, rows[0]);
  }),

  remove: asyncHandler(async (req, res) => {
    let sql = 'DELETE FROM declarations WHERE id = $1';
    const params = [req.params.id];
    if (!req.isAdmin) { sql += ` AND biller_id = $${params.length + 1}::uuid`; params.push(req.billerId); }
    const { rowCount } = await pool.query(sql, params);
    if (!rowCount) return notFound(res);
    success(res, { message: 'Deleted' });
  }),
};
