import { buildBrowserParser, hasNextPageScript } from '../parser.js';
import { sleep } from '../browser.js';

const BASE_URL = 'https://plataforma.facturatech.co/comprobantes21/';
const parserCode = buildBrowserParser();

const DOC_TYPES = [
  { label: 'Facturas de Venta', tipo_nota: '', prefix: 'FV' },
  { label: 'Notas de Crédito', tipo_nota: 'NC', prefix: 'NC' },
  { label: 'Notas de Débito', tipo_nota: 'ND', prefix: 'ND' },
];

export async function extractInvoices(page, { maxPages = 15, pageSize = 100 } = {}) {
  console.log('[extract:invoices] Starting...');

  let idUs = null;

  const allByNcf = new Map();
  let docTypeIndex = 0;

  for (const docType of DOC_TYPES) {
    console.log(`\n[extract:invoices] --- Type: ${docType.label} ---`);

    await page.goto(BASE_URL + '?se=15', { timeout: 30000, waitUntil: 'networkidle' });
    await sleep(5000);

    await page.selectOption('#registros', String(pageSize)).catch(() => {});
    await sleep(2000);

    if (docType.tipo_nota) {
      await page.selectOption('#tipo_nota', docType.tipo_nota).catch(() => {
        console.log(`[extract:invoices] Warning: could not select tipo_nota=${docType.tipo_nota}`);
      });
      await sleep(3000);
    }

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

          var result = parseDataTable(target);

          // Extract id_comprobante and action metadata from each row
          var rows = target.querySelectorAll('tbody tr');
          for (var r = 1; r < rows.length; r++) {
            var row = rows[r];
            var anchor = row.querySelector('a[id="generar_nota"]');
            if (anchor) {
              var idComp = anchor.getAttribute('id_comprobante');
              if (idComp) {
                if (!result.rows[r - 1]) result.rows[r - 1] = {};
                result.rows[r - 1]._internal_id = idComp.trim();
                result.rows[r - 1]._folio = anchor.getAttribute('folio');
                result.rows[r - 1]._prefijo = anchor.getAttribute('prefijo');
                result.rows[r - 1]._tipo_operacion = anchor.getAttribute('tipo_operacion');
              }
            }
            // Extract XML download URL for idUs
            var xmlLink = row.querySelector('a[href*="tipo=xml"]');
            if (xmlLink) {
              var href = xmlLink.getAttribute('href');
              var match = href.match(/idCom=(\d+)/);
              if (match && (!result.rows[r - 1])) result.rows[r - 1] = {};
              if (match && result.rows[r - 1]) result.rows[r - 1]._id_comprobante = match[1];
              var usMatch = href.match(/idUs=(\d+)/);
              if (usMatch && result.rows[r - 1]) result.rows[r - 1]._id_us = usMatch[1];
            }
          }
          return result;
        })()
      `);

      if (!pageData || !pageData.rows || pageData.rows.length === 0) {
        console.log(`[extract:invoices] ${docType.label} Page ${pageIndex + 1}: no data`);
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
        const key = row.ncf || `${docType.prefix}-${pageIndex}-${Math.random().toString(36).slice(2, 6)}`;
        const enriched = {
          ...row,
          _doc_type_label: docType.label,
          _doc_type_prefix: docType.prefix,
        };
        if (!allByNcf.has(key)) {
          allByNcf.set(key, enriched);
          newCount++;
        }
      }

      console.log(`[extract:invoices] ${docType.label} Page ${pageIndex + 1}: ${pageData.rows.length} rows, ${newCount} new (total: ${allByNcf.size}), headers: [${pageData.headers.join(', ')}]`);

      const hasNext = await page.evaluate(hasNextPageScript());
      if (!hasNext) break;

      await page.click('a:has-text("Siguiente")');
      await sleep(5000);
    }
  }

  const result = Array.from(allByNcf.values());
  console.log(`[extract:invoices] Done: ${result.length} invoices across all types`);
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
