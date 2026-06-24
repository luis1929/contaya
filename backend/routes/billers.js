const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { authMiddleware, adminOnly } = require('../middleware/auth');

router.use(authMiddleware);

router.get('/', async (req, res) => {
  try {
    if (req.user.role === 'biller') {
      const { rows } = await pool.query('SELECT id, name, document_number, email, phone, is_active FROM billers WHERE id = $1', [req.user.biller_id]);
      return res.json(rows);
    }
    const { rows } = await pool.query('SELECT id, name, document_number, email, phone, is_active FROM billers ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', adminOnly, async (req, res) => {
  try {
    const { name, document_type, document_number, email, phone, address, city, password } = req.body;
    const hash = password ? await bcrypt.hash(password, 10) : null;
    const { rows } = await pool.query(
      `INSERT INTO billers (name, document_type, document_number, email, phone, address, city, password)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, name, document_number, email, phone, is_active`,
      [name, document_type || 'NIT', document_number, email, phone, address, city, hash]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', adminOnly, async (req, res) => {
  try {
    const { name, document_type, document_number, email, phone, address, city, is_active } = req.body;
    const { rows } = await pool.query(
      `UPDATE billers SET name=$1, document_type=$2, document_number=$3, email=$4, phone=$5,
       address=$6, city=$7, is_active=$8, updated_at=NOW() WHERE id=$9 RETURNING id, name, document_number, email, phone, is_active`,
      [name, document_type, document_number, email, phone, address, city, is_active, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', adminOnly, async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM billers WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
