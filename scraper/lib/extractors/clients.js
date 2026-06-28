import { buildBrowserParser, hasNextPageScript } from '../parser.js';
import { sleep } from '../browser.js';

const CLIENTS_URL = 'https://plataforma.facturatech.co/clientes21/';
const parserCode = buildBrowserParser();

export async function extractClients(page, { maxPages = 50, pageSize = 100 } = {}) {
  console.log('[extract:clients] Starting...');

  await page.goto(CLIENTS_URL, { timeout: 30000, waitUntil: 'networkidle' });
  await sleep(5000);

  await page.selectOption('#registros', String(pageSize)).catch(() => {});
  await sleep(3000);

  const allByDoc = new Map();
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
              (text.indexOf('nit') !== -1 || text.indexOf('documento') !== -1 || text.indexOf('razon social') !== -1)) {
            target = tables[t];
            break;
          }
        }
        if (!target) return null;
        return parseDataTable(target);
      })()
    `);

    if (!pageData || !pageData.rows || pageData.rows.length === 0) {
      console.log(`[extract:clients] Page ${pageIndex + 1}: no data`);
      break;
    }

    let newCount = 0;
    for (const row of pageData.rows) {
      const key = row.document_number || row.name || `cli-${pageIndex}-${Math.random().toString(36).slice(2, 6)}`;
      if (!allByDoc.has(key)) {
        allByDoc.set(key, row);
        newCount++;
      }
    }

    console.log(`[extract:clients] Page ${pageIndex + 1}: ${pageData.rows.length} rows, ${newCount} new (total: ${allByDoc.size}), headers: [${pageData.headers.join(', ')}]`);

    const hasNext = await page.evaluate(hasNextPageScript());
    if (!hasNext) break;

    await page.click('a:has-text("Siguiente")');
    await sleep(5000);
  }

  const result = Array.from(allByDoc.values());
  console.log(`[extract:clients] Done: ${result.length} clients across ${pageIndex + 1} pages`);
  return result;
}
