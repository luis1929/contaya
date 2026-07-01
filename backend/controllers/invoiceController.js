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

function extractClientName(xmlContent) {
  try {
    const m = xmlContent.match(/<cac:AccountingCustomerParty[\s\S]{0,3000}?<\/cac:AccountingCustomerParty>/);
    if (!m) return '';
    const s = m[0];
    const n = s.match(/<cbc:(Name|RegistrationName)[^>]*>([^<]+)<\/cbc:\1>/);
    if (n) { const v = n[2].trim(); if (v.length > 2) return v; }
  } catch {}
  return '';
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

function extractCreditNoteLines(note) {
  if (!note?.['cac:CreditNoteLine']) return [];
  return toArray(note['cac:CreditNoteLine']).map(line => {
    const item = line['cac:Item'] || {};
    const description = textVal(item['cbc:Description'] || line['cbc:Description']);
    const code = textVal(item['cac:SellersItemIdentification']?.['cbc:ID'] || item['cac:StandardItemIdentification']?.['cbc:ID']);
    const taxSubtotal = line?.['cac:TaxTotal']?.['cac:TaxSubtotal'];
    const taxCategory = taxSubtotal?.['cac:TaxCategory'];
    return {
      code,
      description,
      quantity: numVal(line['cbc:CreditedQuantity']),
      unitPrice: numVal(line?.['cac:Price']?.['cbc:PriceAmount']),
      ivaPercent: numVal(taxCategory?.['cbc:Percent'] || taxSubtotal?.['cbc:Percent']),
      taxAmount: numVal(taxSubtotal?.['cbc:TaxAmount'] || line?.['cac:TaxTotal']?.['cbc:TaxAmount']),
      total: numVal(line['cbc:LineExtensionAmount']),
    };
  });
}

function extractDebitNoteLines(note) {
  if (!note?.['cac:DebitNoteLine']) return [];
  return toArray(note['cac:DebitNoteLine']).map(line => {
    const item = line['cac:Item'] || {};
    const description = textVal(item['cbc:Description'] || line['cbc:Description']);
    const code = textVal(item['cac:SellersItemIdentification']?.['cbc:ID'] || item['cac:StandardItemIdentification']?.['cbc:ID']);
    const taxSubtotal = line?.['cac:TaxTotal']?.['cac:TaxSubtotal'];
    const taxCategory = taxSubtotal?.['cac:TaxCategory'];
    return {
      code,
      description,
      quantity: numVal(line['cbc:DebitedQuantity']),
      unitPrice: numVal(line?.['cac:Price']?.['cbc:PriceAmount']),
      ivaPercent: numVal(taxCategory?.['cbc:Percent'] || taxSubtotal?.['cbc:Percent']),
      taxAmount: numVal(taxSubtotal?.['cbc:TaxAmount'] || line?.['cac:TaxTotal']?.['cbc:TaxAmount']),
      total: numVal(line['cbc:LineExtensionAmount']),
    };
  });
}

function extractCustomerData(doc) {
  if (!doc) return {};
  const party = doc['cac:AccountingCustomerParty']?.['cac:Party'];
  return {
    name: textVal(party?.['cac:PartyName']?.['cbc:Name'])
      || textVal(party?.['cac:PartyLegalEntity']?.['cbc:RegistrationName']),
    email: textVal(party?.['cac:Contact']?.['cbc:ElectronicMail']),
  };
}

function extractDocMetadata(doc) {
  if (!doc) return {};
  return {
    total: numVal(doc['cac:LegalMonetaryTotal']?.['cbc:PayableAmount']),
    subtotal: numVal(doc['cac:LegalMonetaryTotal']?.['cbc:LineExtensionAmount']),
    issueDate: textVal(doc['cbc:IssueDate']),
    signatureDate: textVal(doc['cac:Signature']?.['cbc:SignatureDate']) || textVal(doc['cac:Signature']?.['cbc:SignatureTime']),
    paymentMethod: textVal(doc['cac:PaymentMeans']?.['cbc:PaymentMeansCode']) || textVal(doc['cac:PaymentTerms']?.['cbc:Note']),
    notes: textVal(doc['cbc:Note']) || (Array.isArray(doc['cac:AdditionalDocumentReference']) ? doc['cac:AdditionalDocumentReference'].map(r => textVal(r['cbc:Description'])).join('; ') : textVal(doc['cac:AdditionalDocumentReference']?.['cbc:Description'])),
  };
}

function findInnerInvoice(result) {
  if (result?.AttachedDocument) {
    const doc = result.AttachedDocument;
    const innerXml = doc?.['cac:Attachment']?.['cac:ExternalReference']?.['cbc:Description']
                  || doc?.['cac:Attachment']?.['cac:EmbeddedDocument']?.['cbc:Description']
                  || doc?.['cbc:Description'];
    if (innerXml && typeof innerXml === 'string') return innerXml;
  }
  return null;
}

async function parseInvoiceLines(xmlContent) {
  const result = await parseXmlContent(xmlContent);
  if (result?.Invoice?.['cac:InvoiceLine']) return extractInvoiceLines(result.Invoice);
  if (result?.CreditNote?.['cac:CreditNoteLine']) return extractCreditNoteLines(result.CreditNote);
  if (result?.DebitNote?.['cac:DebitNoteLine']) return extractDebitNoteLines(result.DebitNote);
  const innerXml = findInnerInvoice(result);
  if (innerXml) return parseInvoiceLines(innerXml);
  if (result?.Invoice) return extractInvoiceLines(result.Invoice);
  if (result?.CreditNote) return extractCreditNoteLines(result.CreditNote);
  if (result?.DebitNote) return extractDebitNoteLines(result.DebitNote);
  return [];
}

module.exports = {
  list: asyncHandler(async (req, res) => {
    const { desde, hasta, estatus, facturador, doc_type } = req.query;
    let sql = 'SELECT i.id, i.biller_id, i.ncf, i.status, i.has_xml, i.has_pdf, i.created_at, i.xml_content, i.client_name, i.total, b.name AS biller_name FROM invoices i LEFT JOIN billers b ON i.biller_id = b.id WHERE 1=1';
    const params = [];
    if (desde) { params.push(desde); sql += ` AND i.created_at >= $${params.length}`; }
    if (hasta) { params.push(hasta); sql += ` AND i.created_at <= $${params.length}`; }
    if (estatus) { params.push(estatus); sql += ` AND i.status = $${params.length}`; }
    if (facturador) { params.push(facturador); sql += ` AND i.biller_id = $${params.length}::uuid`; }
    if (doc_type) { params.push(doc_type); sql += ` AND i.doc_type = $${params.length}`; }
    sql += ` AND i.ncf NOT LIKE 'SETT-%'`;
    sql += whereBiller(req, params, 'i');
    sql += " ORDER BY (regexp_replace(i.ncf, '[^0-9]', '', 'g'))::bigint DESC NULLS LAST";
    sql += " ORDER BY (regexp_replace(i.ncf, '[^0-9]', '', 'g'))::bigint DESC NULLS LAST";
    const { rows } = await pool.query(sql, params);
    const enriched = rows.map(r => ({ ...r, client_name: extractClientName(r.xml_content || '') || r.client_name || '', total: r.total || 0, xml_content: undefined }));
    success(res, enriched);
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
    sql += ` AND ncf NOT LIKE 'SETT-%'`;
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

  clientList: asyncHandler(async (req, res) => {
    const { desde, hasta } = req.query;
    let sql = `SELECT i.id, i.xml_content FROM invoices i WHERE i.xml_content IS NOT NULL AND i.xml_content != ''`;
    const params = [];
    if (desde) { params.push(desde); sql += ` AND i.created_at >= $${params.length}`; }
    if (hasta) { params.push(hasta); sql += ` AND i.created_at <= $${params.length}`; }
    sql += whereBiller(req, params, 'i');

    const { rows } = await pool.query(sql, params);
    const map = {};

    for (const row of rows) {
      try {
        const result = await parseXmlContent(row.xml_content);
        const doc = result?.Invoice || result?.CreditNote || result?.DebitNote || null;
        let name = '';

        if (!doc) {
          const innerXml = findInnerInvoice(result);
          if (innerXml) {
            const inner = await parseXmlContent(innerXml);
            const innerDoc = inner?.Invoice || inner?.CreditNote || inner?.DebitNote;
            if (innerDoc) name = extractCustomerData(innerDoc).name;
          }
        } else {
          name = extractCustomerData(doc).name;
        }

        if (name) map[name] = (map[name] || 0) + 1;
      } catch { continue; }
    }

    const result = Object.entries(map)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    success(res, result);
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
    let xmlClientName, xmlClientEmail, xmlTotal, xmlSubtotal, issueDate, signatureDate, paymentMethod, notes;

    if (row.xml_content) {
      try {
        const result = await parseXmlContent(row.xml_content);
        let doc = result?.Invoice || result?.CreditNote || result?.DebitNote;
        let innerXml = null;

        if (!doc) innerXml = findInnerInvoice(result);

        if (innerXml) {
          const innerResult = await parseXmlContent(innerXml);
          doc = innerResult?.Invoice || innerResult?.CreditNote || innerResult?.DebitNote;
          items = await parseInvoiceLines(innerXml);
        }

        if (doc) {
          if (!items.length) items = extractInvoiceLines(doc) || extractCreditNoteLines(doc) || extractDebitNoteLines(doc);
          const customer = extractCustomerData(doc);
          const meta = extractDocMetadata(doc);
          xmlClientName = customer.name;
          xmlClientEmail = customer.email;
          xmlTotal = meta.total;
          xmlSubtotal = meta.subtotal;
          issueDate = meta.issueDate;
          signatureDate = meta.signatureDate;
          paymentMethod = meta.paymentMethod;
          notes = meta.notes;
        }
      } catch (e) {
        console.error('Error parsing XML for invoice', row.id);
      }
    }

    const xmlIva = items.reduce((s, it) => s + it.taxAmount, 0);
    success(res, {
      ...row, items,
      client_name: xmlClientName || row.client_name || '',
      client_email: xmlClientEmail || '',
      total: xmlTotal || row.total || 0,
      subtotal: xmlSubtotal || row.total || 0,
      iva: xmlIva || 0,
      issue_date: issueDate || '',
      signature_date: signatureDate || '',
      payment_method: paymentMethod || '',
      notes: notes || '',
    });
  }),
};
