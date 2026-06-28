const pool = require('../db/pool');
const { success, created, badRequest, notFound, error } = require('../lib/response');
const asyncHandler = require('../lib/asyncHandler');
const { parseRut } = require('../services/rutParser');
const audit = require('../services/auditService');
const { spawn } = require('child_process');
const path = require('path');

module.exports = {
  list: asyncHandler(async (req, res) => {
    let sql;
    const params = [];
    if (req.isAdmin) {
      sql = `SELECT c.*, COUNT(i.id)::int AS invoice_count, COALESCE(SUM(i.total), 0) AS total_sum
             FROM clients c
             LEFT JOIN invoices i ON i.client_id = c.id OR (i.client_id IS NULL AND i.client_name ILIKE c.name)
             GROUP BY c.id ORDER BY c.name`;
    } else {
      params.push(req.billerId);
      sql = `SELECT c.*, COUNT(i.id)::int AS invoice_count, COALESCE(SUM(i.total), 0) AS total_sum
             FROM clients c
             LEFT JOIN invoices i ON i.biller_id = $1::uuid AND (i.client_id = c.id OR (i.client_id IS NULL AND i.client_name ILIKE c.name))
             WHERE c.biller_id = $1::uuid
             GROUP BY c.id ORDER BY c.name`;
    }
    const { rows } = await pool.query(sql, params);
    success(res, rows);
  }),

  uploadRut: asyncHandler(async (req, res) => {
    if (!req.file) return badRequest(res, 'Archivo PDF requerido');
    const extracted = await parseRut(req.file.buffer);
    success(res, extracted);
  }),

  create: asyncHandler(async (req, res) => {
    const { name, email, phone, address, ciudad, rnc, document_type, document_number, verification_digit, regimen, rut_metadata } = req.body;
    if (!name) return badRequest(res, 'name es requerido');
    const bid = req.isAdmin ? (req.body.biller_id || req.billerId) : req.billerId;
    if (!bid) return badRequest(res, 'biller_id es requerido');
    const { rows } = await pool.query(
      `INSERT INTO clients (biller_id, name, email, phone, address, ciudad, rnc, document_type, document_number,
        verification_digit, regimen, rut_metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb) RETURNING *`,
      [bid, name, email || null, phone || null, address || null, ciudad || null, rnc || null,
       document_type || 'NIT', document_number || null, verification_digit || null, regimen || null,
       JSON.stringify(rut_metadata || {})]
    );
    created(res, rows[0]);
  }),

  update: asyncHandler(async (req, res) => {
    const { name, email, phone, address, ciudad, rnc, document_type, document_number, verification_digit, regimen, rut_metadata } = req.body;
    let sql = `UPDATE clients SET name=$1, email=$2, phone=$3, address=$4, ciudad=$5, rnc=$6, document_type=$7,
               document_number=$8, verification_digit=$9, regimen=$10, rut_metadata=$11::jsonb, updated_at=NOW() WHERE id=$12`;
    const params = [name, email || null, phone || null, address || null, ciudad || null, rnc || null,
                    document_type || 'NIT', document_number || null, verification_digit || null, regimen || null,
                    JSON.stringify(rut_metadata || {}), req.params.id];
    if (!req.isAdmin) { sql += ` AND biller_id = $${params.length + 1}::uuid`; params.push(req.billerId); }
    const { rowCount } = await pool.query(sql, params);
    if (!rowCount) return notFound(res);
    const { rows } = await pool.query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
    success(res, rows[0]);
  }),

  remove: asyncHandler(async (req, res) => {
    let sql = 'DELETE FROM clients WHERE id = $1';
    const params = [req.params.id];
    if (!req.isAdmin) { sql += ` AND biller_id = $${params.length + 1}::uuid`; params.push(req.billerId); }
    const { rowCount } = await pool.query(sql, params);
    if (!rowCount) return notFound(res);
    success(res, { message: 'Deleted' });
  }),

  syncFacturatech: asyncHandler(async (req, res) => {
    const { document_number } = req.body;
    if (!document_number) return badRequest(res, 'document_number es requerido');

    const bid = req.isAdmin ? (req.body.biller_id || req.billerId) : req.billerId;
    if (!bid) return badRequest(res, 'biller_id no disponible');

    const { rows: creds } = await pool.query(
      `SELECT username_encrypted, password_encrypted FROM biller_credentials
       WHERE biller_id = $1 AND is_configured = true`,
      [bid]
    );
    if (!creds.length) {
      return badRequest(res, 'No hay credenciales de FacturaTech configuradas para este facturador');
    }

    const crypto = require('../services/cryptoService');
    const user = crypto.decrypt(creds[0].username_encrypted);
    const pass = crypto.decrypt(creds[0].password_encrypted);

    const scraperPath = path.join(__dirname, '../../scraper/index.js');
    const child = spawn('node', [scraperPath, `--biller-id=${bid}`], {
      env: { ...process.env, FACTURATECH_USER: user, FACTURATECH_PASS: pass },
      detached: true, stdio: 'ignore',
    });
    child.unref();

    await pool.query(
      `UPDATE billers SET scrape_status = 'running', scrape_last_run = NOW() WHERE id = $1`,
      [bid]
    );

    success(res, { message: 'Sincronización con FacturaTech iniciada. Los datos se actualizarán en segundo plano.' });
  }),
};
