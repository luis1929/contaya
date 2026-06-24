const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');
const { billerContext, whereBiller } = require('../middleware/tenantContext');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
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

router.use(authMiddleware, billerContext);

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const { rows } = await pool.query(
      `INSERT INTO documents (original_name, filename, size, mimetype, type, biller_id)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.file.originalname, req.file.filename, req.file.size, req.file.mimetype,
       detectType(req.file.originalname), req.billerId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', async (req, res) => {
  try {
    let sql = 'SELECT * FROM documents WHERE 1=1';
    const params = [];
    sql += whereBiller(req, params);
    sql += ' ORDER BY uploaded_at DESC';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    let sql = 'SELECT * FROM documents WHERE id = $1';
    const params = [req.params.id];
    sql += whereBiller(req, params);
    if (req.isAdmin) {
      const { rows } = await pool.query('SELECT * FROM documents WHERE id = $1', [req.params.id]);
      if (!rows.length) return res.status(404).json({ error: 'Not found' });
      return res.json(rows[0]);
    }
    const { rows } = await pool.query(sql, params);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    if (req.isAdmin) {
      const { rowCount } = await pool.query('DELETE FROM documents WHERE id = $1', [req.params.id]);
      if (!rowCount) return res.status(404).json({ error: 'Not found' });
      return res.json({ message: 'Deleted' });
    }
    let sql = 'DELETE FROM documents WHERE id = $1';
    const params = [req.params.id];
    sql += whereBiller(req, params);
    const { rowCount } = await pool.query(sql, params);
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

module.exports = router;
