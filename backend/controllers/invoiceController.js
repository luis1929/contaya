const { parseString } = require('xml2js');
const pool = require('../db/pool');
const { success, created, badRequest, notFound } = require('../lib/response');
const asyncHandler = require('../lib/asyncHandler');
const { whereBiller } = require('../middleware/tenantContext');

function toArray(val) { return Array.isArray(val) ? val : val ? [val] : []; }
function textVal(obj) { if (typeof obj === 'string') return obj; if (obj && typeof obj === 'object') return obj._ ?? ''; return ''; }
function numVal(obj) { return parseFloat(textVal(obj)) || 0; }

function parseXmlContent(xmlContent) {
  return new Promise((resolve, reject) => {
    parseString(xmlContent, { explicitArray: false, mergeAttrs: true }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

function extractInvoiceLines(invoice) {
  if (!invoice?.['cac:InvoiceLine']) return [];
  return toArray(invoice['cac:InvoiceLine']).map(line => {
    const item = line['cac:Item'] || {};
    const note = line['cbc:Note'];
    const description = textVal(
      (Array.isArray(note) ? note[0] : note)
      || item['cbc:Description']
      || line['cbc:Description']
    );
    const code = textVal(
      item['cac:SellersItemIdentification']?.['cbc:ID']
      || item['cac:StandardItemIdentification']?.['cbc:ID']
    );
    const taxSubtotal = line?.['cac:TaxTotal']?.['cac:TaxSubtotal'];
    const taxCategory = taxSubtotal?.['cac:TaxCategory'];
    return {
      code,
      description,
      quantity: numVal(line['cbc:InvoicedQuantity']),
      unitPrice: numVal(line?.['cac:Price']?.['cbc:PriceAmount']),
      ivaPercent: numVal(taxCategory?.['cbc:Percent'] || taxSubtotal?.['cbc:Percent']),
      taxAmount: numVal(taxSubtotal?.['cbc:TaxAmount'] || line?.['cac:TaxTotal']?.['cbc:TaxAmount']),
      total: numVal(line['cbc:LineExtensionAmount']),
    };
  });
}

async function parseInvoiceLines(xmlContent) {
  const result = await parseXmlContent(xmlContent);
  if (result?.Invoice?.['cac:InvoiceLine']) return extractInvoiceLines(result.Invoice);
  if (result?.AttachedDocument) {
    const doc = result.AttachedDocument;
    const innerXml = doc?.['cac:Attachment']?.['cac:ExternalReference']?.['cbc:Description']
                  || doc?.['cac:Attachment']?.['cac:EmbeddedDocument']?.['cbc:Description']
                  || doc?.['cbc:Description'];
    if (innerXml && typeof innerXml === 'string' && innerXml.includes('<Invoice')) {
      return parseInvoiceLines(innerXml);
    }
  }
  if (result?.Invoice) return extractInvoiceLines(result.Invoice);
  return [];
}

module.exports = {
  list: asyncHandler(async (req, res) => {
    const { desde, hasta, estatus, facturador } = req.query;
    let sql = 'SELECT i.id, i.biller_id, i.ncf, i.status, i.has_xml, i.has_pdf, i.created_at, b.name AS biller_name FROM invoices i LEFT JOIN billers b ON i.biller_id = b.id WHERE 1=1';
    const params = [];
    if (desde) { params.push(desde); sql += ` AND i.created_at >= $${params.length}`; }
    if (hasta) { params.push(hasta); sql += ` AND i.created_at <= $${params.length}`; }
    if (estatus) { params.push(estatus); sql += ` AND i.status = $${params.length}`; }
    if (facturador) { params.push(facturador); sql += ` AND i.biller_id = $${params.length}::uuid`; }
    sql += whereBiller(req, params, 'i');
    sql += ' ORDER BY i.created_at DESC NULLS LAST';
    const { rows } = await pool.query(sql, params);
    success(res, rows);
  }),

  summary: asyncHandler(async (req, res) => {
    const { desde, hasta, facturador } = req.query;
    let sql = `SELECT COUNT(*) AS total_count,
      MIN(created_at) AS first_date, MAX(created_at) AS last_date
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
    let sql = 'SELECT biller_id, COUNT(*) AS total_count FROM invoices WHERE biller_id IS NOT NULL';
    const params = [];
    if (desde) { params.push(desde); sql += ` AND created_at >= $${params.length}`; }
    if (hasta) { params.push(hasta); sql += ` AND created_at <= $${params.length}`; }
    sql += whereBiller(req, params);
    sql += ' GROUP BY biller_id';
    const { rows } = await pool.query(sql, params);
    success(res, rows);
  }),

  create: asyncHandler(async (req, res) => {
    const { ncf, status } = req.body;
    const bid = req.isAdmin ? (req.body.biller_id || req.billerId) : req.billerId;
    if (!bid) return badRequest(res, 'biller_id es requerido');
    const { rows } = await pool.query(
      `INSERT INTO invoices (biller_id, ncf, status)
       VALUES ($1, $2, $3) RETURNING *`,
      [bid, ncf || null, status || 'pending']
    );
    created(res, rows[0]);
  }),

  update: asyncHandler(async (req, res) => {
    const { ncf, status } = req.body;
    let sql = 'UPDATE invoices SET ncf=$1, status=$2 WHERE id=$3';
    const params = [ncf || null, status || 'pending', req.params.id];
    if (!req.isAdmin) { sql += ` AND biller_id = $${params.length + 1}::uuid`; params.push(req.billerId); }
    const { rowCount } = await pool.query(sql, params);
    if (!rowCount) return notFound(res);
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

  getById: asyncHandler(async (req, res) => {
    const { rows } = await pool.query(
      `SELECT i.*, b.name AS biller_name, b.document_number AS biller_doc_number
       FROM invoices i LEFT JOIN billers b ON i.biller_id = b.id WHERE i.id = $1`,
      [req.params.id]
    );
    if (!rows.length) return notFound(res);
    const row = rows[0];
    let items = [];
    if (row.xml_content) {
      try {
        items = await parseInvoiceLines(row.xml_content);
      } catch (e) {
        console.error('Error parsing XML for invoice', row.id);
      }
    }
    success(res, { ...row, items });
  }),
};
