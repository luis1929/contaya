const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM company ORDER BY created_at LIMIT 1');
    if (!rows.length) return res.json({ exists: false });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const { name, rnc, address, email, phone } = req.body;
    const { rows: existing } = await pool.query('SELECT id FROM company ORDER BY created_at LIMIT 1');
    if (existing.length) {
      const { rows } = await pool.query(
        `UPDATE company SET name=$1, rnc=$2, address=$3, email=$4, phone=$5, updated_at=NOW() WHERE id=$6 RETURNING *`,
        [name, rnc, address, email, phone, existing[0].id]
      );
      return res.json(rows[0]);
    }
    const { rows } = await pool.query(
      `INSERT INTO company (name, rnc, address, email, phone) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name, rnc, address, email, phone]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
