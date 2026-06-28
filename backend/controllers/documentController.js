const multer = require('multer');
const path = require('path');
const fs = require('fs');
const pool = require('../db/pool');
const { success, created, badRequest, notFound, error } = require('../lib/response');
const asyncHandler = require('../lib/asyncHandler');
const { whereBiller } = require('../middleware/tenantContext');
const audit = require('../services/auditService');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

function getTenantDir(billerId) {
  const dir = path.join(uploadDir, billerId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, getTenantDir(req.billerId)),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png', '.csv', '.xlsx', '.xls', '.xml'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error('Tipo no soportado: ' + ext));
  },
  limits: { fileSize: 20 * 1024 * 1024 },
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

module.exports = {
  uploadSingle: [
    upload.single('file'),
    asyncHandler(async (req, res) => {
      if (!req.file) return badRequest(res, 'No file uploaded');
      const { description, category, tags } = req.body;
      const metadata = {};
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
         detectType(req.file.originalname), description || null, category || null,
         JSON.stringify(metadata), req.billerId]
      );
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
      audit.log(req, { action: 'upload', resource: 'documents', resource_id: rows[0].id, details: { name: req.file.originalname, size: req.file.size, type: req.file.mimetype } });
      created(res, rows[0]);
    }),
  ],

  uploadMultiple: [
    upload.array('files', 10),
    asyncHandler(async (req, res) => {
      if (!req.files || !req.files.length) return badRequest(res, 'No files uploaded');
      const results = [];
      for (const file of req.files) {
        const { rows } = await pool.query(
          `INSERT INTO documents (original_name, filename, size, mimetype, type, biller_id)
           VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
          [file.originalname, file.filename, file.size, file.mimetype, detectType(file.originalname), req.billerId]
        );
        results.push(rows[0]);
      }
      created(res, results);
    }),
  ],

  list: asyncHandler(async (req, res) => {
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
    if (tag) { params.push(tag); sql += ` AND d.id IN (SELECT document_id FROM document_tag_map WHERE tag_id = $${params.length}::int)`; }

    const countResult = await pool.query(`SELECT COUNT(*) FROM (${sql}) AS sub`, params);
    const total = parseInt(countResult.rows[0].count);

    sql += ' ORDER BY d.uploaded_at DESC';
    sql += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const { rows } = await pool.query(sql, params);

    if (rows.length) {
      const ids = rows.map(r => `'${r.id}'`).join(',');
      const { rows: tagRows } = await pool.query(`
        SELECT dtm.document_id, t.id, t.name, t.color
        FROM document_tag_map dtm JOIN document_tags t ON t.id = dtm.tag_id
        WHERE dtm.document_id IN (${ids})
      `);
      const tagMap = {};
      for (const tr of tagRows) {
        if (!tagMap[tr.document_id]) tagMap[tr.document_id] = [];
        tagMap[tr.document_id].push({ id: tr.id, name: tr.name, color: tr.color });
      }
      for (const row of rows) row.tags = tagMap[row.id] || [];
    }

    success(res, { data: rows, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  }),

  getById: asyncHandler(async (req, res) => {
    let sql = 'SELECT d.* FROM documents d WHERE d.id = $1';
    const params = [req.params.id];
    if (!req.isAdmin) sql += whereBiller(req, params, 'd');
    const { rows } = await pool.query(sql, params);
    if (!rows.length) return notFound(res);
    const { rows: tagRows } = await pool.query(`
      SELECT t.id, t.name, t.color FROM document_tag_map dtm
      JOIN document_tags t ON t.id = dtm.tag_id WHERE dtm.document_id = $1
    `, [req.params.id]);
    rows[0].tags = tagRows;
    success(res, rows[0]);
  }),

  download: asyncHandler(async (req, res) => {
    let sql = 'SELECT * FROM documents WHERE id = $1';
    const params = [req.params.id];
    sql += whereBiller(req, params);
    const { rows } = await pool.query(sql, params);
    if (!rows.length) return notFound(res);
    const doc = rows[0];
    const filePath = path.join(getTenantDir(doc.biller_id), doc.filename);
    if (!fs.existsSync(filePath)) return notFound(res, 'File not found on disk');
    audit.log(req, { action: 'download', resource: 'documents', resource_id: doc.id, details: { name: doc.original_name, size: doc.size } });
    res.download(filePath, doc.original_name);
  }),

  remove: asyncHandler(async (req, res) => {
    let sql = 'SELECT * FROM documents WHERE id = $1';
    const params = [req.params.id];
    if (!req.isAdmin) sql += whereBiller(req, params);
    const { rows } = await pool.query(sql, params);
    if (!rows.length) return notFound(res);
    const doc = rows[0];
    const filePath = path.join(getTenantDir(doc.biller_id), doc.filename);
    await pool.query('DELETE FROM documents WHERE id = $1', [req.params.id]);
    try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
    audit.log(req, { action: 'delete', resource: 'documents', resource_id: doc.id, details: { name: doc.original_name } });
    success(res, { message: 'Documento eliminado' });
  }),

  toggleFavorite: asyncHandler(async (req, res) => {
    const { is_favorite } = req.body;
    let sql = 'UPDATE documents SET is_favorite = $1 WHERE id = $2';
    const params = [is_favorite, req.params.id];
    sql += whereBiller(req, params);
    const { rowCount } = await pool.query(sql, params);
    if (!rowCount) return notFound(res);
    success(res, { is_favorite });
  }),

  updateStatus: asyncHandler(async (req, res) => {
    const { workflow_status } = req.body;
    const valid = ['pending', 'reviewed', 'approved', 'rejected', 'archived'];
    if (!valid.includes(workflow_status)) return badRequest(res, 'Estado inválido');
    let sql = 'UPDATE documents SET workflow_status = $1 WHERE id = $2';
    const params = [workflow_status, req.params.id];
    sql += whereBiller(req, params);
    const { rowCount } = await pool.query(sql, params);
    if (!rowCount) return notFound(res);
    success(res, { workflow_status });
  }),
};
