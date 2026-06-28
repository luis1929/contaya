import { buildBrowserParser, hasNextPageScript } from '../parser.js';
import { sleep } from '../browser.js';

const BASE_URL = 'https://plataforma.facturatech.co/comprobantes21/';
const parserCode = buildBrowserParser();

function detectDocType(ncf) {
  if (!ncf) return 'FV';
  const upper = ncf.toUpperCase();
  if (upper.includes('NC') || upper.includes('CREDIT')) return 'NC';
  if (upper.includes('ND') || upper.includes('DEBIT')) return 'ND';
  return 'FV';
}

export async function extractInvoices(page, { maxPages = 15, pageSize = 100 } = {}) {
  console.log('[extract:invoices] Starting...');

  let idUs = null;

  await page.goto(BASE_URL + '?se=15', { timeout: 30000, waitUntil: 'networkidle' });
  await sleep(5000);

  await page.selectOption('#registros', String(pageSize)).catch(() => {});
  await sleep(2000);

  const allByNcf = new Map();
  let pageIndex = 0;

  for (pageIndex = 0; pageIndex < maxPages; pageIndex++) {
    const pageData = await page.evaluate(`
      ${parserCode}
      (function() {
        var tables = document.querySelectorAll('table');
        var target = null;
        for (var t = 0; t < tables.length; t++) {
          var text = tables[t].textContent.toLowerCase();
          if (tables[t].querySelectorAll('tr').length > 3 &&
              (text.indexOf('numeracion') !== -1 || text.indexOf('numeraci') !== -1) &&
              text.indexOf('cliente') !== -1) {
            target = tables[t];
            break;
          }
        }
        if (!target) return null;

        var headers = [];
        var headerRow = target.querySelector('thead tr');
        if (!headerRow) {
          var allRows = target.querySelectorAll('tbody tr, thead tr');
          if (allRows.length === 0) allRows = target.querySelectorAll('tr');
          if (allRows.length > 0 && isHeaderRow(allRows[0])) {
            headerRow = allRows[0];
          }
        }
        if (headerRow) {
          headerRow.querySelectorAll('th, td').forEach(function(cell) {
            headers.push(normalizeHeader(cell.textContent.trim()));
          });
        }

        var rows = target.querySelectorAll('tbody tr');
        if (rows.length === 0) rows = target.querySelectorAll('tr');

        var dataRows = [];
        var startIndex = (rows.length > 0 && isHeaderRow(rows[0])) ? 1 : 0;

        for (var r = startIndex; r < rows.length; r++) {
          var row = rows[r];
          var cells = row.querySelectorAll('td');
          if (cells.length === 0) continue;

          var entry = {};
          var isEmpty = true;

          for (var i = 0; i < cells.length; i++) {
            var val = cells[i].textContent.trim();
            if (headers[i]) {
              entry[headers[i]] = val;
            } else if (i < headers.length) {
              entry[headers[i]] = val;
            } else {
              entry['col_' + i] = val;
            }
            if (val) isEmpty = false;
          }

          // Extract internal id from action buttons
          var anchor = row.querySelector('a[id="generar_nota"]');
          if (anchor) {
            var idComp = anchor.getAttribute('id_comprobante');
            if (idComp) entry._internal_id = idComp.trim();
            var folio = anchor.getAttribute('folio');
            if (folio) entry._folio = folio;
            var prefijo = anchor.getAttribute('prefijo');
            if (prefijo) entry._prefijo = prefijo;
          }

          // Extract XML download IDs
          var xmlLink = row.querySelector('a[href*="tipo=xml"]');
          if (xmlLink) {
            var href = xmlLink.getAttribute('href');
            var idMatch = href.match(/idCom=(\d+)/);
            if (idMatch) entry._id_comprobante = idMatch[1];
            var usMatch = href.match(/idUs=(\d+)/);
            if (usMatch) entry._id_us = usMatch[1];
          }

          if (!isEmpty) dataRows.push(entry);
        }

        return { headers: headers, rows: dataRows };
      })()
    `);

    if (!pageData || !pageData.rows || pageData.rows.length === 0) {
      console.log(`[extract:invoices] Page ${pageIndex + 1}: no data`);
      break;
    }

    // Extract idUs from any row that has it
    if (!idUs) {
      for (const row of pageData.rows) {
        if (row._id_us) {
          idUs = row._id_us;
          break;
        }
      }
    }

    let newCount = 0;
    for (const row of pageData.rows) {
      const key = row.ncf || `inv-${pageIndex}-${Math.random().toString(36).slice(2, 6)}`;
      const docType = detectDocType(row.ncf);
      const enriched = {
        ...row,
        _doc_type: docType,
      };
      if (!allByNcf.has(key)) {
        allByNcf.set(key, enriched);
        newCount++;
      }
    }

    console.log(`[extract:invoices] Page ${pageIndex + 1}: ${pageData.rows.length} rows, ${newCount} new (total: ${allByNcf.size}), headers: [${pageData.headers.join(', ')}]`);

    const hasNext = await page.evaluate(hasNextPageScript());
    if (!hasNext) break;

    await page.click('a:has-text("Siguiente")');
    await sleep(5000);
  }

  const result = Array.from(allByNcf.values());
  console.log(`[extract:invoices] Done: ${result.length} invoices`);
  if (idUs) console.log(`[extract:invoices] FacturaTech user ID (idUs): ${idUs}`);
  return result;
}

export async function extractInvoiceDetail(page, invoice, { timeout = 30000 } = {}) {
  const internalId = invoice._internal_id || invoice._id_comprobante;
  if (!internalId) {
    console.log(`[extract:invoice-detail] No internal_id for invoice ${invoice.ncf}, skipping`);
    return null;
  }

  const detailUrl = BASE_URL + `form_comprobante/?id=${internalId}`;
  console.log(`[extract:invoice-detail] Fetching detail for ${invoice.ncf} (id=${internalId})...`);

  await page.goto(detailUrl, { timeout, waitUntil: 'load' });
  await sleep(3000);

  const detail = await page.evaluate(`
    ${parserCode}
    (function() {
      var result = { items: [], taxes: [], invoice_info: {} };

      // Extract invoice-level metadata from form fields
      var inputs = document.querySelectorAll('input, select, textarea');
      inputs.forEach(function(el) {
        var id = el.id || '';
        if (id) result.invoice_info[id] = el.value || '';
      });

      // Extract line items table
      var tables = document.querySelectorAll('table');
      var itemsTable = null;
      var taxesTable = null;

      for (var t = 0; t < tables.length; t++) {
        var ths = tables[t].querySelectorAll('th');
        var headerText = '';
        ths.forEach(function(th) { headerText += th.textContent.toLowerCase() + ' '; });
        if (headerText.indexOf('nombre') !== -1 && headerText.indexOf('identificador') !== -1 && headerText.indexOf('precio unitario') !== -1) {
          itemsTable = tables[t];
        }
        if (headerText.indexOf('tributo') !== -1 && headerText.indexOf('retencion') !== -1) {
          taxesTable = tables[t];
        }
      }

      if (itemsTable) {
        var parsed = parseDataTable(itemsTable);
        result.items = parsed.rows;
        result.items_headers = parsed.headers;
      }

      if (taxesTable) {
        var taxParsed = parseDataTable(taxesTable);
        result.taxes = taxParsed.rows;
        result.taxes_headers = taxParsed.headers;
      }

      return result;
    })()
  `);

  if (detail && detail.items) {
    console.log(`[extract:invoice-detail] ${invoice.ncf}: ${detail.items.length} items, ${detail.taxes.length} tax entries`);
  } else {
    console.log(`[extract:invoice-detail] ${invoice.ncf}: no items found`);
  }

  return detail;
}
