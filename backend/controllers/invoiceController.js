const { spawn } = require('child_process');
const path = require('path');
const pool = require('../db/pool');
const { success, created, badRequest, notFound, error } = require('../lib/response');
const asyncHandler = require('../lib/asyncHandler');
const { whereBiller } = require('../middleware/tenantContext');
const crypto = require('../services/cryptoService');
const audit = require('../services/auditService');

function adjTotal(col = 'total') {
  return `CASE WHEN doc_type IN ('NCR') THEN -${col} ELSE ${col} END`;
}

async function decryptCredentials(billerId) {
  const { rows } = await pool.query(
    'SELECT username_encrypted, password_encrypted FROM biller_credentials WHERE biller_id = $1 AND is_configured = true',
    [billerId]
  );
  if (!rows.length) return null;
  try {
    return {
      username: crypto.decrypt(rows[0].username_encrypted),
      password: crypto.decrypt(rows[0].password_encrypted),
    };
  } catch {
    return null;
  }
}

module.exports = {
  list: asyncHandler(async (req, res) => {
    const { desde, hasta, cliente, estatus, facturador, client_id } = req.query;
    let sql = 'SELECT i.*, b.name AS biller_name FROM invoices i LEFT JOIN billers b ON i.biller_id = b.id WHERE 1=1';
    const params = [];
    if (desde) { params.push(desde); sql += ` AND i.created_at >= $${params.length}`; }
    if (hasta) { params.push(hasta); sql += ` AND i.created_at <= $${params.length}`; }
    if (cliente) { params.push(`%${cliente}%`); sql += ` AND (i.client_name ILIKE $${params.length} OR i.client ILIKE $${params.length})`; }
    if (estatus) { params.push(estatus); sql += ` AND i.status = $${params.length}`; }
    if (facturador) { params.push(facturador); sql += ` AND i.biller_id = $${params.length}::uuid`; }
    if (client_id) { params.push(client_id); sql += ` AND i.client_id = $${params.length}::uuid`; }
    sql += whereBiller(req, params, 'i');
    sql += ' ORDER BY i.created_at DESC NULLS LAST';
    const { rows } = await pool.query(sql, params);
    success(res, rows);
  }),

  summary: asyncHandler(async (req, res) => {
    const { desde, hasta, facturador } = req.query;
    let sql = `SELECT COUNT(*) AS total_count, COALESCE(SUM(${adjTotal()}), 0) AS total_sum,
      COALESCE(SUM(${adjTotal()}) * 0.19, 0) AS iva_sum, AVG(${adjTotal()}) AS total_avg,
      MIN(created_at) AS first_date, MAX(created_at) AS last_date,
      COUNT(*) FILTER (WHERE paid = true) AS paid_count,
      COALESCE(SUM(${adjTotal()}) FILTER (WHERE paid = true), 0) AS paid_sum
      FROM invoices WHERE 1=1`;
    const params = [];
    if (desde) { params.push(desde); sql += ` AND created_at >= $${params.length}`; }
    if (hasta) { params.push(hasta); sql += ` AND created_at <= $${params.length}`; }
    if (facturador) { params.push(facturador); sql += ` AND biller_id = $${params.length}::uuid`; }
    sql += whereBiller(req, params);
    const { rows } = await pool.query(sql, params);
    success(res, rows[0]);
  }),

  summaryByBiller: asyncHandler(async (req, res) => {
    const { desde, hasta } = req.query;
    let sql = `SELECT biller_id, COUNT(*) AS total_count, COALESCE(SUM(${adjTotal()}), 0) AS total_sum
               FROM invoices WHERE biller_id IS NOT NULL`;
    const params = [];
    if (desde) { params.push(desde); sql += ` AND created_at >= $${params.length}`; }
    if (hasta) { params.push(hasta); sql += ` AND created_at <= $${params.length}`; }
    sql += whereBiller(req, params);
    sql += ' GROUP BY biller_id';
    const { rows } = await pool.query(sql, params);
    success(res, rows);
  }),

  clientsByBiller: asyncHandler(async (req, res) => {
    let billerId = req.query.biller_id;
    if (!req.isAdmin) billerId = req.billerId;
    if (!billerId) return badRequest(res, 'biller_id required');
    const { rows } = await pool.query(`
      SELECT COALESCE(client_name, 'Sin nombre') AS name, COUNT(*)::int AS invoice_count,
        SUM(${adjTotal()}) AS total_sum, MIN(created_at) AS first_date, MAX(created_at) AS last_date
      FROM invoices WHERE biller_id = $1::uuid AND client_name IS NOT NULL
      GROUP BY client_name ORDER BY COUNT(*) DESC
    `, [billerId]);
    success(res, rows);
  }),

  create: asyncHandler(async (req, res) => {
    const { client_name, client_id, ncf, doc_type, total, paid, status, items, raw_data } = req.body;
    if (!client_name) return badRequest(res, 'client_name es requerido');
    const bid = req.isAdmin ? (req.body.biller_id || req.billerId) : req.billerId;
    if (!bid) return badRequest(res, 'biller_id es requerido');
    const { rows } = await pool.query(
      `INSERT INTO invoices (biller_id, client_id, client_name, ncf, doc_type, total, paid, status, raw_data)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [bid, client_id || null, client_name, ncf || null, doc_type || null, total || 0, paid || false, status || 'pending',
       raw_data ? JSON.stringify(raw_data) : null]
    );
    if (items && items.length) {
      for (const item of items) {
        await pool.query(
          'INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount) VALUES ($1,$2,$3,$4,$5)',
          [rows[0].id, item.description, item.quantity || 1, item.unit_price || 0, item.amount || 0]
        );
      }
    }
    created(res, rows[0]);
  }),

  update: asyncHandler(async (req, res) => {
    const { client_name, client_id, ncf, doc_type, total, paid, status, items, raw_data } = req.body;
    let sql = 'UPDATE invoices SET client_name=$1, client_id=$2, ncf=$3, doc_type=$4, total=$5, paid=$6, status=$7, raw_data=$8, updated_at=NOW() WHERE id=$9';
    const params = [client_name, client_id || null, ncf || null, doc_type || null, total || 0,
      paid || false, status || 'pending', raw_data ? JSON.stringify(raw_data) : null, req.params.id];
    if (!req.isAdmin) { sql += ` AND biller_id = $${params.length + 1}::uuid`; params.push(req.billerId); }
    const { rowCount } = await pool.query(sql, params);
    if (!rowCount) return notFound(res);
    if (items) {
      await pool.query('DELETE FROM invoice_items WHERE invoice_id = $1', [req.params.id]);
      for (const item of items) {
        await pool.query(
          'INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, amount) VALUES ($1,$2,$3,$4,$5)',
          [req.params.id, item.description, item.quantity || 1, item.unit_price || 0, item.amount || 0]
        );
      }
    }
    const { rows } = await pool.query('SELECT * FROM invoices WHERE id = $1', [req.params.id]);
    success(res, rows[0]);
  }),

  remove: asyncHandler(async (req, res) => {
    let sql = 'DELETE FROM invoices WHERE id = $1';
    const params = [req.params.id];
    if (!req.isAdmin) { sql += ` AND biller_id = $${params.length + 1}::uuid`; params.push(req.billerId); }
    const { rowCount } = await pool.query(sql, params);
    if (!rowCount) return notFound(res);
    success(res, { message: 'Deleted' });
  }),

  consolidated: asyncHandler(async (req, res) => {
    let billerId = req.query.biller_id;
    if (!req.isAdmin) billerId = req.billerId;
    if (!billerId) return badRequest(res, 'biller_id required');
    const { rows } = await pool.query(`
      SELECT EXTRACT(YEAR FROM created_at)::int AS year, COALESCE(client_name, 'Sin nombre') AS client_name,
        COUNT(*)::int AS invoice_count, SUM(${adjTotal()}) AS total_sum
      FROM invoices WHERE biller_id = $1::uuid AND client_name IS NOT NULL
      GROUP BY year, client_name ORDER BY year DESC, SUM(${adjTotal()}) DESC
    `, [billerId]);
    success(res, rows);
  }),

  getById: asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT i.*, b.name AS biller_name, b.document_number AS biller_doc_number
       FROM invoices i LEFT JOIN billers b ON i.biller_id = b.id WHERE i.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return notFound(res);
    const items = await pool.query(
      'SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at',
      [req.params.id]
    );
    success(res, { ...rows[0], items: items.rows });
  }),

  emitir: asyncHandler(async (req, res) => {
    const billerId = req.user.biller_id || req.billerId;
    if (!billerId) return badRequest(res, 'biller_id no disponible');

    const { client_id, items } = req.body;
    if (!client_id) return badRequest(res, 'Selecciona un cliente');
    if (!items || !items.length) return badRequest(res, 'Agrega al menos un ítem');

    const { rows: [client] } = await pool.query('SELECT * FROM clients WHERE id = $1 AND biller_id = $2', [client_id, billerId]);
    if (!client) return notFound(res, 'Cliente no encontrado');

    const itemIds = items.map(i => i.item_id || i.id);
    const { rows: productRows } = await pool.query(
      'SELECT * FROM items WHERE id = ANY($1::uuid[]) AND biller_id = $2',
      [itemIds, billerId]
    );
    const productMap = {};
    for (const p of productRows) productMap[p.id] = p;

    const lineItems = [];
    let subtotal = 0;
    let totalIva = 0;
    let totalRetenciones = 0;

    for (const entry of items) {
      const pid = entry.item_id || entry.id;
      const product = productMap[pid];
      if (!product) continue;
      const qty = parseFloat(entry.quantity) || 1;
      const unitPrice = parseFloat(product.unit_value) || 0;
      const ivaPct = parseFloat(product.iva_percentage) || 0;
      const retPct = parseFloat(product.retention_percentage) || 0;
      const lineTotal = qty * unitPrice;
      const lineIva = lineTotal * (ivaPct / 100);
      const lineRet = lineTotal * (retPct / 100);
      subtotal += lineTotal;
      totalIva += lineIva;
      totalRetenciones += lineRet;

      lineItems.push({
        item_id: pid,
        code: product.code,
        description: product.description,
        quantity: qty,
        unit_price: unitPrice,
        iva_percentage: ivaPct,
        retention_percentage: retPct,
        total: lineTotal,
      });
    }

    const grandTotal = subtotal + totalIva - totalRetenciones;

    const creds = await decryptCredentials(billerId);

    const consolidated = {
      emisor: { biller_id: billerId, credentials_configured: !!creds },
      cliente: {
        id: client.id,
        name: client.name,
        document_type: client.document_type || 'NIT',
        document_number: client.document_number,
        verification_digit: client.verification_digit,
        address: client.address,
        ciudad: client.ciudad || client.city,
        email: client.email,
        phone: client.phone,
        regimen: client.regimen,
      },
      items: lineItems,
      totals: { subtotal, iva: totalIva, retenciones: totalRetenciones, total: grandTotal },
    };

    const { rows: [invoice] } = await pool.query(
      `INSERT INTO invoices (biller_id, client_id, client_name, total, status, payload, raw_data)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [billerId, client_id, client.name, grandTotal, 'draft',
       JSON.stringify(consolidated), consolidated]
    );

    for (const li of lineItems) {
      await pool.query(
        'INSERT INTO invoice_items (invoice_id, item_id, code, description, quantity, unit_price, iva_percentage, retention_percentage, total) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)',
        [invoice.id, li.item_id, li.code, li.description, li.quantity, li.unit_price, li.iva_percentage, li.retention_percentage, li.total]
      );
    }

    if (creds) {
      const scraperPath = path.join(__dirname, '../../scraper/index.js');
      const child = spawn('node', [scraperPath, `--biller-id=${billerId}`], {
        env: { ...process.env, FACTURATECH_USER: creds.username, FACTURATECH_PASS: creds.password },
        detached: true, stdio: 'ignore',
      });
      child.unref();
      await pool.query("UPDATE invoices SET scraper_status = 'scraping' WHERE id = $1", [invoice.id]);
    }

    audit.log(req, { action: 'create', resource: 'invoices', resource_id: invoice.id, details: { client: client.name, items: lineItems.length, total: grandTotal } });
    success(res, { invoice, consolidated, credentials_configured: !!creds });
  }),
};
