import { buildBrowserParser, hasNextPageScript } from '../parser.js';
import { sleep } from '../browser.js';
import path from 'path';
import fs from 'fs';

const COMPROBANTES_URL = 'https://plataforma.facturatech.co/comprobantes21/';
const parserCode = buildBrowserParser();

const DOWNLOAD_DIR = '/tmp/contaya/comprobantes';

function detectDocType(ncf) {
  if (!ncf) return 'FV';
  const upper = ncf.toUpperCase();
  if (upper.includes('NCE') || upper.includes('NCR')) return 'NCE';
  if (upper.includes('NDE') || upper.includes('NDB')) return 'NDE';
  if (upper.includes('NC')) return 'NC';
  if (upper.includes('ND')) return 'ND';
  return 'FV';
}

export async function extractInvoices(page, { maxPages = 15 } = {}) {
  console.log('[comprobantes] Navegando a comprobantes21...');

  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });

  await page.goto(COMPROBANTES_URL + '?se=15', { timeout: 30000, waitUntil: 'networkidle' });
  await sleep(5000);

  await page.selectOption('#registros', '100').catch(() => {});
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
              (text.indexOf('numeracion') !== -1 || text.indexOf('numeraci') !== -1 || text.indexOf('ncf') !== -1) &&
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
          if (allRows.length > 0 && isHeaderRow(allRows[0])) headerRow = allRows[0];
        }
        if (headerRow) {
          headerRow.querySelectorAll('th, td').forEach(function(cell) {
            headers.push(normalizeHeader(cell.textContent.trim()));
          });
        }

        var rows = target.querySelectorAll('tbody tr');
        if (rows.length === 0) rows = target.querySelectorAll('tr');
        var startIndex = (rows.length > 0 && isHeaderRow(rows[0])) ? 1 : 0;

        var dataRows = [];
        for (var r = startIndex; r < rows.length; r++) {
          var row = rows[r];
          var cells = row.querySelectorAll('td');
          if (cells.length === 0) continue;

          var entry = {};
          var isEmpty = true;
          for (var i = 0; i < cells.length; i++) {
            var val = cells[i].textContent.trim();
            if (headers[i]) entry[headers[i]] = val;
            else if (i < headers.length) entry[headers[i]] = val;
            else entry['col_' + i] = val;
            if (val) isEmpty = false;
          }

          var xmlLink = row.querySelector('a[href*="tipo=xml"]');
          if (xmlLink) {
            var href = xmlLink.getAttribute('href');
            entry._xml_url = href.startsWith('http') ? href : window.location.origin + '/' + href;
            var idMatch = href.match(/idCom=(\d+)/);
            if (idMatch) entry._id_comprobante = idMatch[1];
            var usMatch = href.match(/idUs=(\d+)/);
            if (usMatch) entry._id_us = usMatch[1];
          }

          var pdfLink = row.querySelector('a[href*="tipo=pdf"]');
          if (pdfLink) {
            var pdfHref = pdfLink.getAttribute('href');
            entry._pdf_url = pdfHref.startsWith('http') ? pdfHref : window.location.origin + '/' + pdfHref;
          }

          if (!isEmpty) dataRows.push(entry);
        }
        return { headers: headers, rows: dataRows };
      })()
    `);

    if (!pageData?.rows?.length) {
      console.log(`[comprobantes] Pagina ${pageIndex + 1}: sin datos`);
      break;
    }

    let newCount = 0;
    for (const row of pageData.rows) {
      const ncf = row.ncf || row.numeracion || row.numero;
      if (!ncf) continue;
      if (!allByNcf.has(ncf)) {
        allByNcf.set(ncf, {
          ncf,
          doc_type: detectDocType(ncf),
          client: row.client || row.cliente || '',
          date: row.date || row.fecha || row.fecha_emision || row.creacion || '',
          total: row.total || row.valor || '',
          status: row.status || row.estado || row.estatus || '',
          _xml_url: row._xml_url || null,
          _pdf_url: row._pdf_url || null,
          _id_comprobante: row._id_comprobante || null,
          _id_us: row._id_us || null,
        });
        newCount++;
      }
    }

    console.log(`[comprobantes] Pagina ${pageIndex + 1}: ${pageData.rows.length} filas, ${newCount} nuevas (total: ${allByNcf.size})`);

    const hasNext = await page.evaluate(hasNextPageScript());
    if (!hasNext) break;

    await page.click('a:has-text("Siguiente")');
    await sleep(4000);
  }

  const result = Array.from(allByNcf.values());
  console.log(`[comprobantes] Total: ${result.length} comprobantes`);

  const withXml = result.filter(r => r._xml_url).length;
  const withPdf = result.filter(r => r._pdf_url).length;
  console.log(`[comprobantes] Con URL XML: ${withXml}, Con URL PDF: ${withPdf}`);

  console.log(`\n[comprobantes] Descargando XMLs...`);
  let downloadedXml = 0;
  for (const inv of result) {
    if (!inv._xml_url) continue;
    try {
      await downloadXml(page, inv);
      downloadedXml++;
      if (downloadedXml % 10 === 0) {
        console.log(`[comprobantes] XMLs descargados: ${downloadedXml}/${withXml}`);
      }
    } catch (err) {
      console.error(`[comprobantes] Error descargando XML ${inv.ncf}: ${err.message}`);
    }
  }
  console.log(`[comprobantes] XMLs descargados: ${downloadedXml}/${withXml}`);

  return result;
}

async function downloadXml(page, invoice) {
  const safeNcf = invoice.ncf.replace(/[^a-zA-Z0-9_-]/g, '_');
  const xmlPath = path.join(DOWNLOAD_DIR, `${safeNcf}.xml`);

  if (fs.existsSync(xmlPath)) return;

  const xmlContent = await page.evaluate(async (url) => {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.text();
  }, invoice._xml_url);

  if (!xmlContent || xmlContent.length < 50) {
    throw new Error(`XML too short (${xmlContent?.length || 0} chars)`);
  }

  fs.writeFileSync(xmlPath, xmlContent, 'utf8');
  invoice._xml_path = xmlPath;
}
