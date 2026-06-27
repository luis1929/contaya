const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const { success, created, badRequest, notFound, unauthorized, forbidden, error } = require('../lib/response');
const asyncHandler = require('../lib/asyncHandler');

const JWT_SECRET = process.env.JWT_SECRET || 'contaya_secret_change_in_prod';

module.exports = {
  register: asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return badRequest(res, 'Faltan campos requeridos');
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return conflict(res, 'El correo ya está registrado');
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name, email, hash]
    );
    const token = jwt.sign({ id: rows[0].id, email: rows[0].email }, JWT_SECRET, { expiresIn: '7d' });
    created(res, { user: rows[0], token });
  }),

  login: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return badRequest(res, 'Faltan campos requeridos');
    if (email.includes('@')) return module.exports.loginAdmin(req, res);
    return module.exports.loginCliente(req, res);
  }),

  loginAdmin: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return badRequest(res, 'Faltan campos requeridos');
    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (!rows.length) return unauthorized(res, 'Credenciales inválidas');
    const match = await bcrypt.compare(password, rows[0].password);
    if (!match) return unauthorized(res, 'Credenciales inválidas');
    const token = jwt.sign({ id: rows[0].id, email: rows[0].email, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
    const { password: _, ...user } = rows[0];
    success(res, { user: { ...user, role: 'admin' }, token });
  }),

  loginCliente: asyncHandler(async (req, res) => {
    const { nit, password } = req.body;
    if (!nit || !password) return badRequest(res, 'NIT y contraseña requeridos');
    let { rows: billers } = await pool.query('SELECT * FROM billers WHERE document_number = $1', [nit]);
    if (!billers.length) {
      billers = (await pool.query('SELECT * FROM billers WHERE document_number LIKE $1', [nit + '-%'])).rows;
    }
    if (!billers.length) return unauthorized(res, 'Credenciales inválidas');
    const match = await bcrypt.compare(password, billers[0].password || '');
    if (!match) return unauthorized(res, 'Credenciales inválidas');
    if (billers[0].is_active === false) return forbidden(res, 'Cuenta desactivada. Contacte al administrador.');
    const token = jwt.sign({
      biller_id: billers[0].id, name: billers[0].name,
      document_number: billers[0].document_number, role: 'biller'
    }, JWT_SECRET, { expiresIn: '7d' });
    success(res, {
      user: { id: billers[0].id, name: billers[0].name, nit: billers[0].document_number, role: 'biller' }, token
    });
  }),

  resetPassword: asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return badRequest(res, 'Faltan campos requeridos');
    const { rows } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (!rows.length) return notFound(res, 'No hay cuenta con ese correo');
    const hash = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hash, email]);
    success(res, { message: 'Contraseña restablecida correctamente' });
  }),

  getMe: asyncHandler(async (req, res) => {
    if (req.user.role === 'biller') {
      return success(res, { id: req.user.biller_id, name: req.user.name, role: 'biller' });
    }
    const { rows } = await pool.query('SELECT id, name, email, created_at FROM users WHERE id = $1', [req.user.id]);
    if (!rows.length) return notFound(res, 'User not found');
    success(res, { ...rows[0], role: 'admin' });
  }),

  changePasswordCliente: asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, nit } = req.body;
    if (!currentPassword || !newPassword) return badRequest(res, 'Faltan campos requeridos');
    if (newPassword.length < 6) return badRequest(res, 'La nueva contraseña debe tener al menos 6 caracteres');
    const docNumber = nit || req.user?.document_number;
    if (!docNumber) return badRequest(res, 'NIT requerido');
    const { rows } = await pool.query('SELECT password FROM billers WHERE document_number = $1', [docNumber]);
    if (!rows.length) return notFound(res, 'Usuario no encontrado');
    const match = await bcrypt.compare(currentPassword, rows[0].password || '');
    if (!match) return unauthorized(res, 'La contraseña actual es incorrecta');
    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE billers SET password = $1, updated_at = NOW() WHERE document_number = $2', [hash, docNumber]);
    success(res, { message: 'Contraseña actualizada correctamente' });
  }),

  changePassword: asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return badRequest(res, 'Faltan campos requeridos');
    if (newPassword.length < 6) return badRequest(res, 'La nueva contraseña debe tener al menos 6 caracteres');

    if (req.user.role === 'biller') {
      const { rows } = await pool.query('SELECT password FROM billers WHERE id = $1', [req.user.biller_id]);
      if (!rows.length) return notFound(res, 'Usuario no encontrado');
      const match = await bcrypt.compare(currentPassword, rows[0].password || '');
      if (!match) return unauthorized(res, 'La contraseña actual es incorrecta');
      const hash = await bcrypt.hash(newPassword, 10);
      await pool.query('UPDATE billers SET password = $1, updated_at = NOW() WHERE id = $2', [hash, req.user.biller_id]);
    } else {
      const { rows } = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
      if (!rows.length) return notFound(res, 'Usuario no encontrado');
      const match = await bcrypt.compare(currentPassword, rows[0].password);
      if (!match) return unauthorized(res, 'La contraseña actual es incorrecta');
      const hash = await bcrypt.hash(newPassword, 10);
      await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hash, req.user.id]);
    }
    success(res, { message: 'Contraseña actualizada correctamente' });
  }),

  impersonate: asyncHandler(async (req, res) => {
    if (req.user.role !== 'admin') return forbidden(res, 'Solo administradores pueden impersonar');
    const { rows } = await pool.query(
      'SELECT id, name, document_number FROM billers WHERE id = $1 AND is_active = true',
      [req.params.biller_id]
    );
    if (!rows.length) return notFound(res, 'Facturador no encontrado');
    const biller = rows[0];
    const token = jwt.sign({
      biller_id: biller.id, name: biller.name,
      document_number: biller.document_number, role: 'biller',
      impersonated_by: req.user.id
    }, JWT_SECRET, { expiresIn: '2h' });
    success(res, { token, biller: { id: biller.id, name: biller.name, document_number: biller.document_number } });
  }),
};
