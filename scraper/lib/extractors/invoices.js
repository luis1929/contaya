import { buildBrowserParser, hasNextPageScript } from '../parser.js';
import { sleep } from '../browser.js';

const INVOICES_URL = 'https://plataforma.facturatech.co/comprobantes21/?se=15';
const parserCode = buildBrowserParser();

export async function extractInvoices(page, { maxPages = 15, pageSize = 100 } = {}) {
  console.log('[extract:invoices] Starting...');

  await page.goto(INVOICES_URL, { timeout: 30000, waitUntil: 'networkidle' });
  await sleep(5000);

  await page.selectOption('#registros', String(pageSize)).catch(() => {});
  await sleep(3000);

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
        return parseDataTable(target);
      })()
    `);

    if (!pageData || !pageData.rows || pageData.rows.length === 0) {
      console.log(`[extract:invoices] Page ${pageIndex + 1}: no data`);
      break;
    }

    let newCount = 0;
    for (const row of pageData.rows) {
      const key = row.ncf || `inv-${pageIndex}-${Math.random().toString(36).slice(2, 6)}`;
      if (!allByNcf.has(key)) {
        allByNcf.set(key, row);
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
  console.log(`[extract:invoices] Done: ${result.length} invoices across ${pageIndex + 1} pages`);
  return result;
}
