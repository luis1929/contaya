import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('https://plataforma.facturatech.co/login/', { timeout: 30000, waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.fill('input[type="text"]', '900948052');
await page.fill('input[type="password"]', 'Esquivel2026$');
await page.click('button[type="submit"]');
await page.waitForTimeout(5000);
await page.goto('https://plataforma.facturatech.co/comprobantes21/?se=15', { timeout: 30000, waitUntil: 'networkidle' });
await page.waitForTimeout(3000);

// Get the HTML of the first data row in the main table
const html = await page.evaluate(() => {
  // Find the main data table - table with many rows and columns
  const tables = document.querySelectorAll('table');
  for (const t of tables) {
    const rows = t.querySelectorAll('tbody tr');
    if (rows.length > 3) {
      const firstRow = rows[0];
      return firstRow.innerHTML.substring(0, 2000);
    }
  }
  return 'no table found';
});
console.log('First data row HTML:');
console.log(html);
await browser.close();
