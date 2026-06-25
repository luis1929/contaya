const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');
const { billerContext, whereBiller } = require('../middleware/tenantContext');

router.use(authMiddleware, billerContext);

router.get('/', async (req, res) => {
  try {
    const params = [];
    let where = whereBiller(req, params);
    if (!where) where = ' WHERE 1=1';

    const { rows: invoices } = await pool.query(`
      SELECT
        EXTRACT(YEAR FROM created_at)::int AS year,
        EXTRACT(MONTH FROM created_at)::int AS month,
        COALESCE(doc_type, 'FCF') AS doc_type,
        SUM(CASE WHEN doc_type IN ('NCR') THEN -total ELSE total END) AS total_sum,
        COUNT(*)::int AS invoice_count
      FROM invoices
      ${where}
      GROUP BY year, month, doc_type
      ORDER BY year DESC, month DESC
    `, params);

    const { rows: declarations } = await pool.query(`
      SELECT d.*
      FROM declarations d
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

    const declarationsList = Object.values(monthlyMap).map(m => {
      const period = `${m.year}-${String(m.month).padStart(2, '0')}`;
      const submitted = declarations.filter(d => d.year === m.year && d.month === m.month);

      const findDecl = (type) => submitted.find(d => d.type === type);

      const ivaDecl = findDecl('IVA');
      const rentaDecl = findDecl('Renta');
      const icaDecl = findDecl('ICA');
      const retDecl = findDecl('Retención');

      return {
        period,
        year: m.year,
        month: m.month,
        invoice_count: m.invoice_count,
        iva: {
          base: m.iva_base,
          tax: Math.round(m.iva_base * 0.19),
          status: ivaDecl ? ivaDecl.status : 'pending',
          submitted_date: ivaDecl ? ivaDecl.submitted_date : null,
          declaration_id: ivaDecl ? ivaDecl.id : null,
        },
        renta: {
          base: m.renta_base,
          tax: Math.round(m.renta_base * 0.25),
          status: rentaDecl ? rentaDecl.status : 'pending',
          submitted_date: rentaDecl ? rentaDecl.submitted_date : null,
          declaration_id: rentaDecl ? rentaDecl.id : null,
        },
        ica: {
          base: m.ica_base,
          tax: Math.round(m.ica_base * 0.01),
          status: icaDecl ? icaDecl.status : 'pending',
          submitted_date: icaDecl ? icaDecl.submitted_date : null,
          declaration_id: icaDecl ? icaDecl.id : null,
        },
        retencion: {
          base: m.retencion_base,
          tax: Math.round(m.retencion_base * 0.11),
          status: retDecl ? retDecl.status : 'pending',
          submitted_date: retDecl ? retDecl.submitted_date : null,
          declaration_id: retDecl ? retDecl.id : null,
        },
      };
    });

    res.json(declarationsList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/summary', async (req, res) => {
  try {
    const params = [];
    let where = whereBiller(req, params);
    if (!where) where = ' WHERE 1=1';

    const { rows } = await pool.query(`
      SELECT
        COUNT(DISTINCT CONCAT(EXTRACT(YEAR FROM created_at), '-', EXTRACT(MONTH FROM created_at)))::int AS total_periods,
        SUM(CASE WHEN doc_type IN ('NCR') THEN -total ELSE total END) AS total_base,
        SUM(CASE WHEN doc_type IN ('NCR') THEN -total ELSE total END) * 0.19 AS total_iva,
        SUM(CASE WHEN doc_type IN ('NCR') THEN -total ELSE total END) * 0.25 AS total_renta,
        COUNT(*)::int AS total_invoices
      FROM invoices
      ${where}
    `, params);

    const { rows: declCount } = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'submitted')::int AS submitted,
        COUNT(*) FILTER (WHERE status = 'pending')::int AS pending,
        COUNT(*) FILTER (WHERE status = 'overdue')::int AS overdue
      FROM declarations
      ${where.replace('WHERE', 'WHERE biller_id IS NOT NULL AND')}
    `, params.length ? params : []);

    res.json({
      ...rows[0],
      declarations: declCount[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { type, year, month, status, notes } = req.body;
    if (!type || !year || !month) return res.status(400).json({ error: 'type, year y month son requeridos' });
    const bid = req.isAdmin ? (req.body.biller_id || req.billerId) : req.billerId;

    const { rows } = await pool.query(
      `INSERT INTO declarations (biller_id, type, year, month, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [bid, type, year, month, status || 'pending', notes || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { status, submitted_date, notes } = req.body;
    let sql = `UPDATE declarations SET status=$1, submitted_date=$2, notes=$3, updated_at=NOW() WHERE id=$4`;
    const params = [status, submitted_date || null, notes || null, req.params.id];

    if (!req.isAdmin) {
      sql += ` AND biller_id = $${params.length + 1}::uuid`;
      params.push(req.billerId);
    }

    const { rowCount } = await pool.query(sql, params);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });

    const { rows } = await pool.query('SELECT * FROM declarations WHERE id = $1', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    let sql = 'DELETE FROM declarations WHERE id = $1';
    const params = [req.params.id];

    if (!req.isAdmin) {
      sql += ` AND biller_id = $${params.length + 1}::uuid`;
      params.push(req.billerId);
    }

    const { rowCount } = await pool.query(sql, params);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
