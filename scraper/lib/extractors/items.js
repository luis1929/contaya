import { buildBrowserParser, hasNextPageScript } from '../parser.js';
import { sleep } from '../browser.js';

const ITEMS_URL = 'https://plataforma.facturatech.co/items21/';
const parserCode = buildBrowserParser();

export async function extractItems(page, { maxPages = 50, pageSize = 100 } = {}) {
  console.log('[extract:items] Starting...');

  await page.goto(ITEMS_URL, { timeout: 30000, waitUntil: 'networkidle' });
  await sleep(5000);

  await page.selectOption('#registros', String(pageSize)).catch(() => {});
  await sleep(3000);

  const allByCode = new Map();
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
              (text.indexOf('codigo') !== -1 || text.indexOf('código') !== -1 || text.indexOf('descripcion') !== -1 || text.indexOf('descripción') !== -1)) {
            target = tables[t];
            break;
          }
        }
        if (!target) return null;
        return parseDataTable(target);
      })()
    `);

    if (!pageData || !pageData.rows || pageData.rows.length === 0) {
      console.log(`[extract:items] Page ${pageIndex + 1}: no data`);
      break;
    }

    let newCount = 0;
    for (const row of pageData.rows) {
      const key = row.code || row.description || `itm-${pageIndex}-${Math.random().toString(36).slice(2, 6)}`;
      if (!allByCode.has(key)) {
        allByCode.set(key, row);
        newCount++;
      }
    }

    console.log(`[extract:items] Page ${pageIndex + 1}: ${pageData.rows.length} rows, ${newCount} new (total: ${allByCode.size}), headers: [${pageData.headers.join(', ')}]`);

    const hasNext = await page.evaluate(hasNextPageScript());
    if (!hasNext) break;

    await page.click('a:has-text("Siguiente")');
    await sleep(5000);
  }

  const result = Array.from(allByCode.values());
  console.log(`[extract:items] Done: ${result.length} items across ${pageIndex + 1} pages`);
  return result;
}
