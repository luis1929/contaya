const pool = require('../db/pool');
const { success, created, badRequest, notFound, error } = require('../lib/response');
const asyncHandler = require('../lib/asyncHandler');
const { parseExcel } = require('../services/excelParser');
const audit = require('../services/auditService');

module.exports = {
  list: asyncHandler(async (req, res) => {
    const billerId = req.user.biller_id;
    const { search, type, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;
    const params = [billerId];
    let where = 'WHERE biller_id = $1';
    let idx = 1;

    if (search) { idx++; params.push(`%${search}%`); where += ` AND (code ILIKE $${idx} OR description ILIKE $${idx})`; }
    if (type) { idx++; params.push(type); where += ` AND type = $${idx}`; }

    const count = await pool.query(`SELECT COUNT(*) FROM items ${where}`, params);
    const { rows } = await pool.query(
      `SELECT * FROM items ${where} ORDER BY created_at DESC LIMIT $${idx + 1} OFFSET $${idx + 2}`,
      [...params, limit, offset]
    );
    const total = parseInt(count.rows[0].count);
    success(res, { data: rows, total, page: parseInt(page), totalPages: Math.ceil(total / limit) });
  }),

  create: asyncHandler(async (req, res) => {
    const billerId = req.user.biller_id;
    const { code, unspsc_code, description, type, unit_value, iva_percentage, retention_percentage } = req.body;
    if (!code || !description) return badRequest(res, 'Código y descripción requeridos');
    const { rows } = await pool.query(
      `INSERT INTO items (biller_id, code, unspsc_code, description, type, unit_value, iva_percentage, retention_percentage)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [billerId, code, unspsc_code || null, description, type || 'producto', unit_value || 0, iva_percentage ?? 19, retention_percentage ?? 0]
    );
    created(res, rows[0]);
  }),

  update: asyncHandler(async (req, res) => {
    const billerId = req.user.biller_id;
    const { code, unspsc_code, description, type, unit_value, iva_percentage, retention_percentage, is_active } = req.body;
    const { rowCount, rows } = await pool.query(
      `UPDATE items SET code=$1, unspsc_code=$2, description=$3, type=$4, unit_value=$5,
       iva_percentage=$6, retention_percentage=$7, is_active=$8, updated_at=NOW()
       WHERE id=$9 AND biller_id=$10 RETURNING *`,
      [code, unspsc_code || null, description, type || 'producto', unit_value || 0, iva_percentage ?? 19, retention_percentage ?? 0, is_active ?? true, req.params.id, billerId]
    );
    if (!rowCount) return notFound(res);
    success(res, rows[0]);
  }),

  remove: asyncHandler(async (req, res) => {
    const billerId = req.user.biller_id;
    const { rowCount } = await pool.query('DELETE FROM items WHERE id=$1 AND biller_id=$2', [req.params.id, billerId]);
    if (!rowCount) return notFound(res);
    success(res, { message: 'Item eliminado' });
  }),

  preview: asyncHandler(async (req, res) => {
    if (!req.file) return badRequest(res, 'Archivo Excel requerido');
    const result = parseExcel(req.file.buffer);
    success(res, result);
  }),

  confirmUpload: asyncHandler(async (req, res) => {
    const billerId = req.user.biller_id;
    const { rows: items } = req.body;
    if (!items || !items.length) return badRequest(res, 'No hay ítems para guardar');

    const inserted = [];
    const errors = [];
    for (const item of items) {
      try {
        const { rows } = await pool.query(
          `INSERT INTO items (biller_id, code, unspsc_code, description, type, unit_value, iva_percentage, retention_percentage)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, code, description`,
          [billerId, item.code, item.unspsc_code || null, item.description, item.type || 'producto', item.unit_value || 0, item.iva_percentage ?? 19, item.retention_percentage ?? 0]
        );
        inserted.push(rows[0]);
      } catch (err) {
        errors.push({ code: item.code, error: err.message });
      }
    }

    audit.log(req, { action: 'create', resource: 'items', details: { inserted: inserted.length, errors: errors.length } });
    success(res, { inserted, errors, total: items.length });
  }),
};
