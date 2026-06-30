const pool = require('../db/pool');
const { success, badRequest } = require('../lib/response');
const asyncHandler = require('../lib/asyncHandler');
const { whereBiller } = require('../middleware/tenantContext');
const { parseString } = require('xml2js');

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

function extractLines(invoice) {
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

function extractClientName(invoice) {
  try {
    return textVal(invoice['cac:AccountingCustomerParty']?.['cac:Party']?.['cac:PartyName']?.['cbc:Name']);
  } catch { return ''; }
}

function extractNcf(invoice) {
  return textVal(invoice['cbc:ID']);
}

async function parseInvoiceData(xmlContent) {
  const result = await parseXmlContent(xmlContent);
  let invoice = result?.Invoice;
  if (!invoice && result?.AttachedDocument) {
    const doc = result.AttachedDocument;
    const innerXml = doc?.['cac:Attachment']?.['cac:ExternalReference']?.['cbc:Description']
                  || doc?.['cac:Attachment']?.['cac:EmbeddedDocument']?.['cbc:Description']
                  || doc?.['cbc:Description'];
    if (innerXml && typeof innerXml === 'string' && innerXml.includes('<Invoice')) {
      return parseInvoiceData(innerXml);
    }
  }
  if (!invoice) return { items: [], clientName: '', ncf: '' };
  return {
    items: extractLines(invoice),
    clientName: extractClientName(invoice),
    ncf: extractNcf(invoice),
  };
}

module.exports = {
  topProducts: asyncHandler(async (req, res) => {
    const { desde, hasta, limit = 20 } = req.query;
    const params = [];
    let dateFilter = '';
    if (desde) { params.push(desde); dateFilter += ` AND i.created_at >= $${params.length}`; }
    if (hasta) { params.push(hasta); dateFilter += ` AND i.created_at <= $${params.length}`; }

    let sql = `SELECT i.id, i.client_name, i.xml_content FROM invoices i WHERE i.xml_content IS NOT NULL AND i.xml_content != '' ${dateFilter}`;
    sql += whereBiller(req, params, 'i');

    const { rows } = await pool.query(sql, params);
    const groups = {};

    for (const row of rows) {
      let data;
      try { data = await parseInvoiceData(row.xml_content); } catch { continue; }
      for (const line of data.items) {
        const key = `${line.code}|${line.description}`;
        if (!groups[key]) {
          groups[key] = { code: line.code, description: line.description, total_qty: 0, total_value: 0, invoice_ids: new Set(), client_names: new Set() };
        }
        groups[key].total_qty += line.quantity;
        groups[key].total_value += line.total;
        groups[key].invoice_ids.add(row.id);
        if (data.clientName) groups[key].client_names.add(data.clientName);
      }
    }

    const result = Object.values(groups)
      .sort((a, b) => b.total_qty - a.total_qty)
      .slice(0, parseInt(limit) || 20)
      .map(g => ({
        code: g.code,
        description: g.description,
        total_qty: g.total_qty,
        total_value: g.total_value,
        invoice_count: g.invoice_ids.size,
        client_count: g.client_names.size,
      }));

    success(res, result);
  }),

  productClients: asyncHandler(async (req, res) => {
    const { code, desde, hasta } = req.query;
    if (!code) return badRequest(res, 'code is required');

    const params = [];
    let dateFilter = '';
    if (desde) { params.push(desde); dateFilter += ` AND i.created_at >= $${params.length}`; }
    if (hasta) { params.push(hasta); dateFilter += ` AND i.created_at <= $${params.length}`; }

    let sql = `SELECT i.id, i.created_at, i.xml_content FROM invoices i WHERE i.xml_content IS NOT NULL AND i.xml_content != '' ${dateFilter}`;
    sql += whereBiller(req, params, 'i');

    const { rows } = await pool.query(sql, params);
    const clientMap = {};

    for (const row of rows) {
      let data;
      try { data = await parseInvoiceData(row.xml_content); } catch { continue; }
      const matchingLines = data.items.filter(l => l.code === code);
      if (!matchingLines.length) continue;
      const name = data.clientName || 'Sin nombre';
      if (!clientMap[name]) {
        clientMap[name] = { client_name: name, order_count: 0, total_qty: 0, total_value: 0, first_date: row.created_at, last_date: row.created_at };
      }
      clientMap[name].order_count++;
      for (const line of matchingLines) {
        clientMap[name].total_qty += line.quantity;
        clientMap[name].total_value += line.total;
      }
      if (new Date(row.created_at) < new Date(clientMap[name].first_date)) clientMap[name].first_date = row.created_at;
      if (new Date(row.created_at) > new Date(clientMap[name].last_date)) clientMap[name].last_date = row.created_at;
    }

    const result = Object.values(clientMap).sort((a, b) => b.total_qty - a.total_qty);
    success(res, result);
  }),

  monthlySales: asyncHandler(async (req, res) => {
    const { code, client, year } = req.query;
    const params = [];
    let filters = '';

    if (client) { params.push(`%${client}%`); filters += ` AND i.client_name ILIKE $${params.length}`; }
    if (year) { params.push(parseInt(year)); filters += ` AND EXTRACT(YEAR FROM i.created_at) = $${params.length}`; }

    let sql = `SELECT i.id, i.created_at, i.client_name, i.xml_content FROM invoices i WHERE i.xml_content IS NOT NULL AND i.xml_content != '' ${filters}`;
    sql += whereBiller(req, params, 'i');
    sql += ' ORDER BY i.created_at';

    const { rows } = await pool.query(sql, params);
    const groups = {};

    for (const row of rows) {
      let data;
      try { data = await parseInvoiceData(row.xml_content); } catch { continue; }
      const d = new Date(row.created_at);
      const yearKey = d.getFullYear();
      const monthKey = d.getMonth() + 1;
      const period = `${yearKey}-${String(monthKey).padStart(2, '0')}`;

      const lines = code ? data.items.filter(l => l.code === code) : data.items;
      if (!lines.length) continue;

      if (!groups[period]) {
        groups[period] = { year: yearKey, month: monthKey, period, invoice_ids: new Set(), total_qty: 0, total_value: 0 };
      }
      groups[period].invoice_ids.add(row.id);
      for (const line of lines) {
        groups[period].total_qty += line.quantity;
        groups[period].total_value += line.total;
      }
    }

    const result = Object.values(groups)
      .sort((a, b) => b.year - a.year || b.month - a.month)
      .map(g => ({
        year: g.year,
        month: g.month,
        period: g.period,
        invoice_count: g.invoice_ids.size,
        total_qty: g.total_qty,
        total_value: g.total_value,
      }));

    success(res, result);
  }),

  clientProducts: asyncHandler(async (req, res) => {
    const { client, desde, hasta } = req.query;
    if (!client) return badRequest(res, 'client is required');

    const params = [`%${client}%`];
    let dateFilter = '';
    if (desde) { params.push(desde); dateFilter += ` AND i.created_at >= $${params.length}`; }
    if (hasta) { params.push(hasta); dateFilter += ` AND i.created_at <= $${params.length}`; }

    let sql = `SELECT i.id, i.xml_content FROM invoices i WHERE i.client_name ILIKE $1 AND i.xml_content IS NOT NULL AND i.xml_content != '' ${dateFilter}`;
    sql += whereBiller(req, params, 'i');

    const { rows } = await pool.query(sql, params);
    const groups = {};

    for (const row of rows) {
      let data;
      try { data = await parseInvoiceData(row.xml_content); } catch { continue; }
      for (const line of data.items) {
        const key = `${line.code}|${line.description}`;
        if (!groups[key]) {
          groups[key] = { code: line.code, description: line.description, total_qty: 0, total_value: 0, order_count: 0 };
        }
        groups[key].total_qty += line.quantity;
        groups[key].total_value += line.total;
        groups[key].order_count++;
      }
    }

    const result = Object.values(groups).sort((a, b) => b.total_qty - a.total_qty);
    success(res, result);
  }),

  productRelations: asyncHandler(async (req, res) => {
    const { code, limit = 10 } = req.query;
    if (!code) return badRequest(res, 'code is required');

    const params = [];
    let sql = `SELECT i.id, i.xml_content FROM invoices i WHERE i.xml_content IS NOT NULL AND i.xml_content != ''`;
    sql += whereBiller(req, params, 'i');

    const { rows } = await pool.query(sql, params);
    const pairMap = {};

    for (const row of rows) {
      let data;
      try { data = await parseInvoiceData(row.xml_content); } catch { continue; }
      const hasTarget = data.items.some(l => l.code === code);
      if (!hasTarget) continue;
      for (const line of data.items) {
        if (line.code === code || !line.code) continue;
        const key = `${line.code}|${line.description}`;
        if (!pairMap[key]) {
          pairMap[key] = { code: line.code, description: line.description, together_count: 0, total_qty: 0 };
        }
        pairMap[key].together_count++;
        pairMap[key].total_qty += line.quantity;
      }
    }

    const result = Object.values(pairMap)
      .sort((a, b) => b.together_count - a.together_count)
      .slice(0, parseInt(limit) || 10);

    success(res, result);
  }),

  stats: asyncHandler(async (req, res) => {
    const params = [];
    let sql = `SELECT i.id, i.xml_content FROM invoices i WHERE i.xml_content IS NOT NULL AND i.xml_content != ''`;
    sql += whereBiller(req, params, 'i');

    const { rows } = await pool.query(sql, params);
    const productCodes = new Set();
    let invoicesWithItems = 0;
    let totalLineItems = 0;
    let totalValue = 0;
    let totalQty = 0;

    for (const row of rows) {
      let data;
      try { data = await parseInvoiceData(row.xml_content); } catch { continue; }
      if (data.items.length) invoicesWithItems++;
      for (const line of data.items) {
        if (line.code) productCodes.add(line.code);
        totalLineItems++;
        totalValue += line.total;
        totalQty += line.quantity;
      }
    }

    success(res, {
      total_products: productCodes.size,
      invoices_with_items: invoicesWithItems,
      total_line_items: totalLineItems,
      total_value: totalValue,
      total_qty: totalQty,
    });
  }),
};
