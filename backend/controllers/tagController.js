const pool = require('../db/pool');
const { success, created, badRequest, conflict, error } = require('../lib/response');
const asyncHandler = require('../lib/asyncHandler');
const { whereBiller } = require('../middleware/tenantContext');

module.exports = {
  list: asyncHandler(async (req, res) => {
    let sql = 'SELECT * FROM document_tags WHERE 1=1';
    const params = [];
    sql += whereBiller(req, params);
    sql += ' ORDER BY name';
    const { rows } = await pool.query(sql, params);
    success(res, rows);
  }),

  create: asyncHandler(async (req, res) => {
    const { name, color } = req.body;
    if (!name) return badRequest(res, 'Nombre requerido');
    const { rows } = await pool.query(
      'INSERT INTO document_tags (name, color, biller_id) VALUES ($1, $2, $3) RETURNING *',
      [name, color || '#2563eb', req.billerId]
    );
    created(res, rows[0]);
  }),

  remove: asyncHandler(async (req, res) => {
    await pool.query('DELETE FROM document_tags WHERE id = $1', [req.params.id]);
    success(res, { message: 'Tag eliminado' });
  }),
};
