import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('https://plataforma.facturatech.co/login/', { timeout: 30000, waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.fill('input[type="text"]', '900948052');
await page.fill('input[type="password"]', 'Esquivel2026$');
await page.click('button[type="submit"]');
await page.waitForTimeout(5000);
// Go to comprobantes page
await page.goto('https://plataforma.facturatech.co/comprobantes21/?se=15', { timeout: 30000, waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
console.log('URL:', page.url());
// Get full page structure - find the actual data table
const info = await page.evaluate(() => {
  // Find all divs/sections
  const result = {};
  // Get all table-like structures
  const tables = document.querySelectorAll('table');
  result.tableCount = tables.length;
  result.tables = [];
  tables.forEach((t, i) => {
    const rows = t.querySelectorAll('tr');
    const headers = Array.from(t.querySelectorAll('th')).map(th => th.textContent.trim());
    const dataRows = [];
    t.querySelectorAll('tbody tr').forEach(tr => {
      const cells = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim().substring(0, 50));
      if (cells.length > 1) dataRows.push(cells);
    });
    result.tables.push({ index: i, headerCount: headers.length, dataRowCount: dataRows.length, firstRow: dataRows[0] || null });
  });
  return result;
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
