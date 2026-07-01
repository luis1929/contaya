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

const html = await page.evaluate(() => {
  const tables = document.querySelectorAll('table');
  // Get the main data table (index 2 from earlier exploration)
  const t = tables[2];
  if (!t) return 'no table at index 2';
  const rows = t.querySelectorAll('tbody tr');
  if (rows.length === 0) return 'no rows in tbody';
  return rows[0].innerHTML.substring(0, 3000);
});
console.log('Main data table first row HTML:');
console.log(html);
await browser.close();
