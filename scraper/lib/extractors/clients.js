import { buildBrowserParser, hasNextPageScript } from '../parser.js';
import { sleep } from '../browser.js';

const CLIENTS_URL = 'https://plataforma.facturatech.co/clientes21/';
const parserCode = buildBrowserParser();

export async function extractClients(page, { maxPages = 50 } = {}) {
  console.log('[clientes] Navegando a clientes21...');

  await page.goto(CLIENTS_URL + '?se=14', { timeout: 30000, waitUntil: 'networkidle' });
  await sleep(4000);

  await page.selectOption('#registros', '100').catch(() => {});
  await sleep(2000);

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

    if (!pageData?.rows?.length) {
      console.log(`[clientes] Pagina ${pageIndex + 1}: sin datos`);
      break;
    }

    let newCount = 0;
    for (const row of pageData.rows) {
      const doc = row.document_number || row.nit || row.documento || row.identificacion || row.rnc;
      const key = doc || `cli-${pageIndex}-${Math.random().toString(36).slice(2, 6)}`;
      if (!allByDoc.has(key)) {
        allByDoc.set(key, {
          document: doc || '',
          name: row.name || row.nombre || row.cliente || row.razon_social || '',
          email: row.email || row.correo || '',
          phone: row.phone || row.telefono || row.celular || '',
          address: row.address || row.direccion || '',
          city: row.city || row.ciudad || row.municipio || '',
        });
        newCount++;
      }
    }

    console.log(`[clientes] Pagina ${pageIndex + 1}: ${pageData.rows.length} filas, ${newCount} nuevas (total: ${allByDoc.size})`);

    const hasNext = await page.evaluate(hasNextPageScript());
    if (!hasNext) break;

    await page.click('a:has-text("Siguiente")');
    await sleep(4000);
  }

  const result = Array.from(allByDoc.values());
  console.log(`[clientes] Total: ${result.length} clientes`);
  return result;
}
