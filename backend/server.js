const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { Pool } = require('pg');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'contaya_secret_change_in_prod';

const app = express();
const PORT = process.env.PORT || 3001;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'contaya',
  password: process.env.DB_PASSWORD || 'contaya123',
  database: process.env.DB_NAME || 'contaya',
});

app.use(cors());
app.use(express.json());

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
app.use('/uploads', express.static(uploadDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.csv', '.xlsx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error('Tipo no soportado: ' + ext));
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'No token provided' });
  try {
    const token = header.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

function adjTotal(col = 'total') {
  return `CASE WHEN doc_type IN ('NCR') THEN -${col} ELSE ${col} END`;
}

app.post('/api/auth/register', async (req, res) => {
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

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Faltan campos requeridos' });

    // If identifier looks like an email, try admin login first
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

    // Try biller login by document_number (NIT)
    // Try exact match first, then if NIT has no DV suffix, match by prefix
    let { rows: billers } = await pool.query('SELECT * FROM billers WHERE document_number = $1', [email]);
    if (!billers.length && !email.includes('@')) {
      // Try matching NIT with DV (e.g. "72005672" matches "72005672-4")
      billers = (await pool.query('SELECT * FROM billers WHERE document_number LIKE $1', [email + '-%'])).rows;
    }
    if (billers.length) {
      const match = await bcrypt.compare(password, billers[0].password || '');
      if (match) {
        const token = jwt.sign({ biller_id: billers[0].id, name: billers[0].name, document_number: billers[0].document_number, role: 'biller' }, JWT_SECRET, { expiresIn: '7d' });
        return res.json({ user: { id: billers[0].id, name: billers[0].name, role: 'biller' }, token });
      }
    }

    return res.status(401).json({ error: 'Credenciales inválidas' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
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

app.get('/api/auth/me', authMiddleware, async (req, res) => {
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

app.get('/api/clients', authMiddleware, async (req, res) => {
  try {
    let sql = `
      SELECT c.*, COUNT(i.id)::int AS invoice_count, COALESCE(SUM(i.total), 0) AS total_sum
      FROM clients c LEFT JOIN invoices i ON i.client_id = c.id
    `;
    const params = [];
    if (req.user.role === 'biller') {
      params.push(req.user.biller_id);
      sql += ` AND i.biller_id = $1::uuid`;
    } else {
      sql += ` WHERE 1=1`;
    }
    sql += ` GROUP BY c.id ORDER BY c.name`;
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/invoices', authMiddleware, async (req, res) => {
  try {
    const { desde, hasta, cliente, estatus, facturador } = req.query;
    let sql = `SELECT invoices.*, billers.name AS biller_name FROM invoices LEFT JOIN billers ON invoices.biller_id = billers.id WHERE 1=1`;
    const params = [];
    if (desde) { params.push(desde); sql += ` AND invoices.created_at >= $${params.length}`; }
    if (hasta) { params.push(hasta); sql += ` AND invoices.created_at <= $${params.length}`; }
    if (cliente) { params.push(`%${cliente}%`); sql += ` AND (client_name ILIKE $${params.length} OR client ILIKE $${params.length})`; }
    if (estatus) { params.push(estatus); sql += ` AND status = $${params.length}`; }
    if (facturador) { params.push(facturador); sql += ` AND biller_id = $${params.length}::uuid`; }
    if (req.user.role === 'biller') { params.push(req.user.biller_id); sql += ` AND invoices.biller_id = $${params.length}::uuid`; }
    sql += ' ORDER BY invoices.created_at DESC NULLS LAST';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/invoices/summary', authMiddleware, async (req, res) => {
  try {
    const { desde, hasta, facturador } = req.query;
    let sql = `
      SELECT
        COUNT(*) AS total_count,
        COALESCE(SUM(${adjTotal()}), 0) AS total_sum,
        COALESCE(SUM(${adjTotal()}) * 0.19, 0) AS iva_sum,
        AVG(${adjTotal()}) AS total_avg,
        MIN(created_at) AS first_date,
        MAX(created_at) AS last_date,
        COUNT(*) FILTER (WHERE paid = true) AS paid_count,
        COALESCE(SUM(${adjTotal()}) FILTER (WHERE paid = true), 0) AS paid_sum
      FROM invoices WHERE 1=1
    `;
    const params = [];
    if (desde) { params.push(desde); sql += ` AND created_at >= $${params.length}`; }
    if (hasta) { params.push(hasta); sql += ` AND created_at <= $${params.length}`; }
    if (facturador) { params.push(facturador); sql += ` AND biller_id = $${params.length}::uuid`; }
    if (req.user.role === 'biller') { params.push(req.user.biller_id); sql += ` AND biller_id = $${params.length}::uuid`; }
    const { rows } = await pool.query(sql, params);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/invoices/summary-by-biller', authMiddleware, async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    let sql = `
      SELECT
        biller_id,
        COUNT(*) AS total_count,
        COALESCE(SUM(${adjTotal()}), 0) AS total_sum
      FROM invoices WHERE biller_id IS NOT NULL
    `;
    const params = [];
    if (desde) { params.push(desde); sql += ` AND created_at >= $${params.length}`; }
    if (hasta) { params.push(hasta); sql += ` AND created_at <= $${params.length}`; }
    if (req.user.role === 'biller') { params.push(req.user.biller_id); sql += ` AND biller_id = $${params.length}::uuid`; }
    sql += ' GROUP BY biller_id';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/invoices/clients-by-biller', authMiddleware, async (req, res) => {
  try {
    let biller_id = req.query.biller_id;
    if (req.user.role === 'biller') biller_id = req.user.biller_id;
    if (!biller_id) return res.status(400).json({ error: 'biller_id required' });
    const { rows } = await pool.query(`
      SELECT
        COALESCE(client_name, 'Sin nombre') AS name,
        COUNT(*)::int AS invoice_count,
        SUM(${adjTotal()}) AS total_sum,
        MIN(created_at) AS first_date,
        MAX(created_at) AS last_date
      FROM invoices
      WHERE biller_id = $1::uuid AND client_name IS NOT NULL
      GROUP BY client_name
      ORDER BY COUNT(*) DESC
    `, [biller_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/invoices/consolidated', authMiddleware, async (req, res) => {
  try {
    let biller_id = req.query.biller_id;
    if (req.user.role === 'biller') biller_id = req.user.biller_id;
    if (!biller_id) return res.status(400).json({ error: 'biller_id required' });
    const { rows } = await pool.query(`
      SELECT
        EXTRACT(YEAR FROM created_at)::int AS year,
        COALESCE(client_name, 'Sin nombre') AS client_name,
        COUNT(*)::int AS invoice_count,
        SUM(${adjTotal()}) AS total_sum
      FROM invoices
      WHERE biller_id = $1::uuid AND client_name IS NOT NULL
      GROUP BY year, client_name
      ORDER BY year DESC, SUM(${adjTotal()}) DESC
    `, [biller_id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/billers', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'biller') {
      const { rows } = await pool.query('SELECT * FROM billers WHERE id = $1', [req.user.biller_id]);
      return res.json(rows);
    }
    const { rows } = await pool.query('SELECT * FROM billers ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/billers', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Solo administradores' });
    const { name, document_type, document_number, email, phone, address, city } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO billers (name, document_type, document_number, email, phone, address, city)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, document_type, document_number, email, phone, address, city]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/billers/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Solo administradores' });
    const { name, document_type, document_number, email, phone, address, city, is_active } = req.body;
    const { rows } = await pool.query(
      `UPDATE billers SET name=$1, document_type=$2, document_number=$3, email=$4, phone=$5,
       address=$6, city=$7, is_active=$8, updated_at=NOW() WHERE id=$9 RETURNING *`,
      [name, document_type, document_number, email, phone, address, city, is_active, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/billers/:id', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Solo administradores' });
    const { rowCount } = await pool.query('DELETE FROM billers WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Contaya API running' });
});

app.post('/api/documents/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { rows } = await pool.query(
      'INSERT INTO documents (original_name, filename, size, mimetype, type) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [req.file.originalname, req.file.filename, req.file.size, req.file.mimetype, detectType(req.file.originalname)]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/documents', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM documents ORDER BY uploaded_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/documents/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/documents/:id', async (req, res) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM documents WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function detectType(name) {
  const n = name.toLowerCase();
  if (n.includes('factura') || n.includes('invoice')) return 'invoice';
  if (n.includes('nota') && n.includes('credito')) return 'credit_note';
  if (n.includes('nota') && n.includes('debito')) return 'debit_note';
  if (n.includes('extracto') || n.includes('estado') || n.includes('bank')) return 'statement';
  if (n.includes('recibo') || n.includes('receipt')) return 'receipt';
  return 'other';
}

app.listen(PORT, () => {
  console.log('Contaya backend running on port ' + PORT);
});
