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

router.post('/', async (req, res) => {
  try {
    const { name, email, phone, address, rnc } = req.body;
    if (!name) return res.status(400).json({ error: 'name es requerido' });
    const bid = req.isAdmin ? (req.body.biller_id || req.billerId) : req.billerId;
    if (!bid) return res.status(400).json({ error: 'biller_id es requerido' });

    const { rows } = await pool.query(
      `INSERT INTO clients (biller_id, name, email, phone, address, rnc)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [bid, name, email || null, phone || null, address || null, rnc || null]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, email, phone, address, rnc } = req.body;
    let sql = `UPDATE clients SET name=$1, email=$2, phone=$3, address=$4, rnc=$5, updated_at=NOW() WHERE id=$6`;
    const params = [name, email || null, phone || null, address || null, rnc || null, req.params.id];

    if (!req.isAdmin) {
      sql += ` AND biller_id = $${params.length + 1}::uuid`;
      params.push(req.billerId);
    }

    const { rowCount } = await pool.query(sql, params);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });

    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    let sql = 'DELETE FROM clients WHERE id = $1';
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
