const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');
const { billerContext, whereBiller } = require('../middleware/tenantContext');

router.use(authMiddleware, billerContext);

router.get('/', async (req, res) => {
  try {
    let sql;
    const params = [];

    if (req.isAdmin) {
      // Admin: todos los clientes con su conteo de facturas
      sql = `
        SELECT c.*, COUNT(i.id)::int AS invoice_count, COALESCE(SUM(i.total), 0) AS total_sum
        FROM clients c
        LEFT JOIN invoices i ON i.client_id = c.id
        GROUP BY c.id ORDER BY c.name
      `;
    } else {
      // Biller: solo clientes que tengan facturas de ese biller
      params.push(req.billerId);
      sql = `
        SELECT c.*, COUNT(i.id)::int AS invoice_count, COALESCE(SUM(i.total), 0) AS total_sum
        FROM clients c
        INNER JOIN invoices i ON i.client_id = c.id AND i.biller_id = $1::uuid
        GROUP BY c.id ORDER BY c.name
      `;
    }

    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
