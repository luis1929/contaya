const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');
const { billerContext, whereBiller } = require('../middleware/tenantContext');
const { requirePermission } = require('../middleware/rbac');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Tenant-scoped upload folders
function getTenantDir(billerId) {
  const dir = path.join(uploadDir, billerId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = getTenantDir(req.billerId);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.csv', '.xlsx', '.xls', '.xml'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error('Tipo no soportado: ' + ext));
  },
  limits: { fileSize: 20 * 1024 * 1024 }
});

router.use(authMiddleware, billerContext);

/* ─── Upload con metadata ─── */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { description, category, tags } = req.body;
    const metadata = {};

    // Extraer metadata de PDF si es posible
    if (req.file.mimetype === 'application/pdf') {
      try {
        const pdfParse = require('pdf-parse');
        const dataBuffer = fs.readFileSync(req.file.path);
        const pdfData = await pdfParse(dataBuffer);
        metadata.pages = pdfData.numpages;
        metadata.text_preview = pdfData.text.substring(0, 500);
      } catch (e) { /* ignore */ }
    }

    const { rows } = await pool.query(
      `INSERT INTO documents (original_name, filename, size, mimetype, type, description, category, metadata, biller_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.file.originalname, req.file.filename, req.file.size, req.file.mimetype,
       detectType(req.file.originalname), description || null, category || detectCategory(req.file.originalname),
       JSON.stringify(metadata), req.billerId]
    );

    // Asignar tags si se proporcionaron
    if (tags) {
      const tagList = Array.isArray(tags) ? tags : JSON.parse(tags);
      for (const tagId of tagList) {
        await pool.query(
          'INSERT INTO document_tag_map (document_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [rows[0].id, tagId]
        );
      }
      rows[0].tags = tagList;
    }

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── Multi-upload ─── */
router.post('/upload-multiple', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || !req.files.length) return res.status(400).json({ error: 'No files uploaded' });

    const results = [];
    for (const file of req.files) {
      const { rows } = await pool.query(
        `INSERT INTO documents (original_name, filename, size, mimetype, type, biller_id)
         VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
        [file.originalname, file.filename, file.size, file.mimetype, detectType(file.originalname), req.billerId]
      );
      results.push(rows[0]);
    }

    res.status(201).json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── List con filtros avanzados ─── */
router.get('/', async (req, res) => {
  try {
    const { type, category, search, status, favorite, tag, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let sql = 'SELECT d.* FROM documents d WHERE 1=1';

    sql += whereBiller(req, params, 'd');
    if (type) { params.push(type); sql += ` AND d.type = $${params.length}`; }
    if (category) { params.push(category); sql += ` AND d.category = $${params.length}`; }
    if (status) { params.push(status); sql += ` AND d.workflow_status = $${params.length}`; }
    if (favorite === 'true') sql += ' AND d.is_favorite = true';
    if (search) { params.push(`%${search}%`); sql += ` AND (d.original_name ILIKE $${params.length} OR d.description ILIKE $${params.length})`; }

    // Filtro por tag
    if (tag) {
      params.push(tag);
      sql += ` AND d.id IN (SELECT document_id FROM document_tag_map WHERE tag_id = $${params.length}::int)`;
    }

    // Count
    const countResult = await pool.query(`SELECT COUNT(*) FROM (${sql}) AS sub`, params);
    const total = parseInt(countResult.rows[0].count);

    sql += ' ORDER BY d.uploaded_at DESC';
    sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await pool.query(sql, params);

    // Cargar tags para cada documento
    if (rows.length) {
      const ids = rows.map(r => `'${r.id}'`).join(',');
      const { rows: tagRows } = await pool.query(`
        SELECT dtm.document_id, t.id, t.name, t.color
        FROM document_tag_map dtm
        JOIN document_tags t ON t.id = dtm.tag_id
        WHERE dtm.document_id IN (${ids})
      `);
      const tagMap = {};
      for (const tr of tagRows) {
        if (!tagMap[tr.document_id]) tagMap[tr.document_id] = [];
        tagMap[tr.document_id].push({ id: tr.id, name: tr.name, color: tr.color });
      }
      for (const row of rows) row.tags = tagMap[row.id] || [];
    }

    res.json({ data: rows, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── Favoritos ─── */
router.patch('/:id/favorite', async (req, res) => {
  try {
    const { is_favorite } = req.body;
    let sql = 'UPDATE documents SET is_favorite = $1 WHERE id = $2';
    const params = [is_favorite, req.params.id];
    sql += whereBiller(req, params);
    const { rowCount } = await pool.query(sql, params);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ is_favorite });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── Workflow status ─── */
router.patch('/:id/status', async (req, res) => {
  try {
    const { workflow_status } = req.body;
    const valid = ['pending', 'reviewed', 'approved', 'rejected', 'archived'];
    if (!valid.includes(workflow_status)) return res.status(400).json({ error: 'Estado inválido' });

    let sql = 'UPDATE documents SET workflow_status = $1 WHERE id = $2';
    const params = [workflow_status, req.params.id];
    sql += whereBiller(req, params);
    const { rowCount } = await pool.query(sql, params);
    if (!rowCount) return res.status(404).json({ error: 'Not found' });
    res.json({ workflow_status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── Notes ─── */
router.post('/:id/notes', async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'Contenido requerido' });
    const { rows } = await pool.query(
      'INSERT INTO document_notes (document_id, content, created_by) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, content, req.user.id || req.user.biller_id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id/notes', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM document_notes WHERE document_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── Tags ─── */
router.get('/tags', async (req, res) => {
  try {
    let sql = 'SELECT * FROM document_tags WHERE 1=1';
    const params = [];
    sql += whereBiller(req, params);
    sql += ' ORDER BY name';
    const { rows } = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/tags', async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ error: 'Nombre requerido' });
    const { rows } = await pool.query(
      'INSERT INTO document_tags (name, color, biller_id) VALUES ($1, $2, $3) RETURNING *',
      [name, color || '#2563eb', req.billerId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Tag ya existe' });
    res.status(500).json({ error: err.message });
  }
});

router.delete('/tags/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM document_tags WHERE id = $1', [req.params.id]);
    res.json({ message: 'Tag eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── Download ─── */
router.get('/:id/download', async (req, res) => {
  try {
    let sql = 'SELECT * FROM documents WHERE id = $1';
    const params = [req.params.id];
    sql += whereBiller(req, params);
    const { rows } = await pool.query(sql, params);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });

    const doc = rows[0];
    const filePath = path.join(getTenantDir(doc.biller_id), doc.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File not found on disk' });

    res.download(filePath, doc.original_name);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── Get single ─── */
router.get('/:id', async (req, res) => {
  try {
    let sql = 'SELECT d.* FROM documents d WHERE d.id = $1';
    const params = [req.params.id];
    if (!req.isAdmin) sql += whereBiller(req, params, 'd');
    const { rows } = await pool.query(sql, params);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });

    // Cargar tags
    const { rows: tagRows } = await pool.query(`
      SELECT t.id, t.name, t.color FROM document_tag_map dtm
      JOIN document_tags t ON t.id = dtm.tag_id
      WHERE dtm.document_id = $1
    `, [req.params.id]);
    rows[0].tags = tagRows;

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─── Delete ─── */
router.delete('/:id', async (req, res) => {
  try {
    let sql = 'SELECT * FROM documents WHERE id = $1';
    const params = [req.params.id];
    if (!req.isAdmin) sql += whereBiller(req, params);

    const { rows } = await pool.query(sql, params);
    if (!rows.length) return res.status(404).json({ error: 'Not found' });

    const doc = rows[0];
    const filePath = path.join(getTenantDir(doc.biller_id), doc.filename);

    await pool.query('DELETE FROM documents WHERE id = $1', [req.params.id]);

    // Eliminar archivo físico
    try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }

    res.json({ message: 'Documento eliminado' });
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
  if (n.includes('declaracion') || n.includes('declaration')) return 'tax_declaration';
  return 'other';
}

function detectCategory(name) {
  const n = name.toLowerCase();
  if (n.includes('pdf')) return 'pdf';
  if (n.includes('xls')) return 'spreadsheet';
  if (n.includes('csv')) return 'data';
  if (n.includes('jpg') || n.includes('jpeg') || n.includes('png')) return 'image';
  if (n.includes('xml')) return 'xml';
  return 'other';
}

module.exports = router;
