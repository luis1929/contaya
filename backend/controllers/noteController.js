const pool = require('../db/pool');
const { success, created, badRequest, error } = require('../lib/response');
const asyncHandler = require('../lib/asyncHandler');

module.exports = {
  list: asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      'SELECT * FROM document_notes WHERE document_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );
    success(res, rows);
  }),

  create: asyncHandler(async (req, res) => {
    const { content } = req.body;
    if (!content) return badRequest(res, 'Contenido requerido');
    const { rows } = await pool.query(
      'INSERT INTO document_notes (document_id, content, created_by) VALUES ($1, $2, $3) RETURNING *',
      [req.params.id, content, req.user.id || req.user.biller_id]
    );
    created(res, rows[0]);
  }),
};
