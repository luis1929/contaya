const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'contaya_secret_change_in_prod';

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Faltan campos requeridos' });
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return res.status(409).json({ error: 'El correo ya está registrado' });
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name, email, hash]
    );
    const token = jwt.sign({ id: rows[0].id, email: rows[0].email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ user: rows[0], token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Faltan campos requeridos' });

    if (email.includes('@')) {
      const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
      if (rows.length) {
        const match = await bcrypt.compare(password, rows[0].password);
        if (match) {
          const token = jwt.sign({ id: rows[0].id, email: rows[0].email, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
          const { password: _, ...user } = rows[0];
          return res.json({ user: { ...user, role: 'admin' }, token });
        }
      }
    }

    let { rows: billers } = await pool.query('SELECT * FROM billers WHERE document_number = $1', [email]);
    if (!billers.length && !email.includes('@')) {
      billers = (await pool.query('SELECT * FROM billers WHERE document_number LIKE $1', [email + '-%'])).rows;
    }
    if (billers.length) {
      const match = await bcrypt.compare(password, billers[0].password || '');
      if (match && billers[0].is_active !== false) {
        const token = jwt.sign({
          biller_id: billers[0].id,
          name: billers[0].name,
          document_number: billers[0].document_number,
          role: 'biller'
        }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({
          user: { id: billers[0].id, name: billers[0].name, role: 'biller' },
          token
        });
      }
    }

    return res.status(401).json({ error: 'Credenciales inválidas' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Faltan campos requeridos' });
    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (!rows.length) return res.status(404).json({ error: 'No hay cuenta con ese correo' });
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hash, email]);
    res.json({ message: 'Contraseña restablecida correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/me', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'biller') {
      return res.json({ id: req.user.biller_id, name: req.user.name, role: 'biller' });
    }
    const { rows } = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json({ ...rows[0], role: 'admin' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/impersonate/:biller_id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Solo administradores pueden impersonar' });
    }
    const { rows } = await pool.query(
      'SELECT id, name, document_number FROM billers WHERE id = $1 AND is_active = true',
      [req.params.biller_id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Facturador no encontrado' });
    const biller = rows[0];
    const token = jwt.sign({
      biller_id: biller.id,
      name: biller.name,
      document_number: biller.document_number,
      role: 'biller',
      impersonated_by: req.user.id
    }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, biller: { id: biller.id, name: biller.name, document_number: biller.document_number } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
