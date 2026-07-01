import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('https://plataforma.facturatech.co/login/', { timeout: 60000, waitUntil: 'load' });
await page.waitForTimeout(2000);
await page.fill('input[type="text"]', '900948052');
await page.fill('input[type="password"]', 'Esquivel2026$');
await page.click('button[type="submit"]');
await page.waitForTimeout(8000);
await page.goto('https://plataforma.facturatech.co/comprobantes21/form_comprobante/?id=98098173', { timeout: 60000, waitUntil: 'load' });
await page.waitForTimeout(3000);
console.log('URL:', page.url());
const text = await page.evaluate(() => document.body.textContent.substring(0, 500));
console.log('Body text:', text);
const tables = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('table')).map((t, i) => ({
    index: i,
    headers: Array.from(t.querySelectorAll('th')).map(th => th.textContent.trim()),
    rows: t.querySelectorAll('tbody tr').length
  })).filter(t => t.headers.length > 1);
});
console.log('Tables:', JSON.stringify(tables, null, 2));
await browser.close();
