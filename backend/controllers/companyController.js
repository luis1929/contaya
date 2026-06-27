const pool = require('../db/pool');
const { success, error } = require('../lib/response');
const asyncHandler = require('../lib/asyncHandler');

module.exports = {
  get: asyncHandler(async (req, res) => {
    const { rows } = await pool.query('SELECT * FROM company ORDER BY created_at LIMIT 1');
    if (!rows.length) return success(res, { exists: false });
    success(res, rows[0]);
  }),

  upsert: asyncHandler(async (req, res) => {
    const { name, rnc, address, email, phone } = req.body;
    const { rows: existing } = await pool.query('SELECT id FROM company ORDER BY created_at LIMIT 1');
    if (existing.length) {
      const { rows } = await pool.query(
        'UPDATE company SET name=$1, rnc=$2, address=$3, email=$4, phone=$5, updated_at=NOW() WHERE id=$6 RETURNING *',
        [name, rnc, address, email, phone, existing[0].id]
      );
      return success(res, rows[0]);
    }
    const { rows } = await pool.query(
      'INSERT INTO company (name, rnc, address, email, phone) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [name, rnc, address, email, phone]
    );
    success(res, rows[0]);
  }),
};
