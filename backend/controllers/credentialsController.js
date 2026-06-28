const pool = require('../db/pool');
const { success, badRequest, notFound, error } = require('../lib/response');
const asyncHandler = require('../lib/asyncHandler');
const crypto = require('../services/cryptoService');
const audit = require('../services/auditService');

module.exports = {
  save: asyncHandler(async (req, res) => {
    const billerId = req.user.biller_id;
    const { username, password } = req.body;
    if (!username || !password) return badRequest(res, 'Usuario y contraseña requeridos');

    const usernameEncrypted = crypto.encrypt(username);
    const passwordEncrypted = crypto.encrypt(password);

    await pool.query(
      `INSERT INTO biller_credentials (biller_id, username_encrypted, password_encrypted, is_configured, updated_at)
       VALUES ($1, $2, $3, true, NOW())
       ON CONFLICT (biller_id)
       DO UPDATE SET username_encrypted = $2, password_encrypted = $3, is_configured = true, updated_at = NOW()`,
      [billerId, usernameEncrypted, passwordEncrypted]
    );

    audit.log(req, { action: 'create', resource: 'credentials', resource_id: billerId, details: { configured: true } });
    success(res, { message: 'Credenciales guardadas correctamente' });
  }),

  status: asyncHandler(async (req, res) => {
    const billerId = req.user.biller_id;
    const { rows } = await pool.query(
      'SELECT is_configured, updated_at FROM biller_credentials WHERE biller_id = $1',
      [billerId]
    );
    success(res, {
      configured: rows.length > 0 ? rows[0].is_configured : false,
      updated_at: rows.length > 0 ? rows[0].updated_at : null,
    });
  }),

  delete: asyncHandler(async (req, res) => {
    const billerId = req.user.biller_id;
    const { rowCount } = await pool.query('DELETE FROM biller_credentials WHERE biller_id = $1', [billerId]);
    if (!rowCount) return notFound(res, 'No hay credenciales configuradas');
    audit.log(req, { action: 'delete', resource: 'credentials', resource_id: billerId, details: { configured: false } });
    success(res, { message: 'Credenciales eliminadas' });
  }),

  adminList: asyncHandler(async (req, res) => {
    const { rows } = await pool.query(`
      SELECT b.id, b.name, b.document_number, bc.is_configured, bc.updated_at
      FROM billers b
      LEFT JOIN biller_credentials bc ON bc.biller_id = b.id
      ORDER BY b.name
    `);
    success(res, rows);
  }),
};
