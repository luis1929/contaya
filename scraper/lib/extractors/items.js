import { buildBrowserParser, hasNextPageScript } from '../parser.js';
import { sleep } from '../browser.js';

const ITEMS_URL = 'https://plataforma.facturatech.co/items21/';
const parserCode = buildBrowserParser();

export async function extractItems(page, { maxPages = 50 } = {}) {
  console.log('[items] Navegando a items21...');

  await page.goto(ITEMS_URL + '?se=13', { timeout: 30000, waitUntil: 'networkidle' });
  await sleep(4000);

  await page.selectOption('#registros', '100').catch(() => {});
  await sleep(2000);

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
              (text.indexOf('codigo') !== -1 || text.indexOf('identificador') !== -1) &&
              (text.indexOf('nombre') !== -1 || text.indexOf('descripcion') !== -1)) {
            target = tables[t];
            break;
          }
        }
        if (!target) return null;
        return parseDataTable(target);
      })()
    `);

    if (!pageData?.rows?.length) {
      console.log(`[items] Pagina ${pageIndex + 1}: sin datos`);
      break;
    }

    let newCount = 0;
    for (const row of pageData.rows) {
      const code = row.code || row.codigo || row.identificador;
      const key = code || `item-${pageIndex}-${Math.random().toString(36).slice(2, 6)}`;
      if (!allByCode.has(key)) {
        allByCode.set(key, {
          code: code || '',
          name: row.name || row.nombre || row.descripcion || row.description || '',
          unit: row.unidad || row.unit || '',
          price: row.precio || row.unit_price || row.valor_unitario || row.unitario || row.precio_unitario || '0',
        });
        newCount++;
      }
    }

    console.log(`[items] Pagina ${pageIndex + 1}: ${pageData.rows.length} filas, ${newCount} nuevas (total: ${allByCode.size})`);

    const hasNext = await page.evaluate(hasNextPageScript());
    if (!hasNext) break;

    await page.click('a:has-text("Siguiente")');
    await sleep(4000);
  }

  const result = Array.from(allByCode.values());
  console.log(`[items] Total: ${result.length} items`);
  return result;
}
