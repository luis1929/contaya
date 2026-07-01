import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('https://plataforma.facturatech.co/login/', { timeout: 30000, waitUntil: 'networkidle' });
await page.waitForTimeout(2000);
await page.fill('input[type="text"]', '900948052');
await page.fill('input[type="password"]', 'Esquivel2026$');
await page.click('button[type="submit"]');
await page.waitForTimeout(5000);
await page.goto('https://plataforma.facturatech.co/comprobantes21/form_comprobante/', { timeout: 30000, waitUntil: 'networkidle' });
await page.waitForTimeout(3000);
console.log('Form URL:', page.url());
const info = await page.evaluate(() => {
  const result = {};
  const links = Array.from(document.querySelectorAll('a[href]')).map(a => ({ text: a.textContent.trim(), href: a.href }));
  result.downloadLinks = links.filter(l => l.text.toLowerCase().includes('pdf') || l.text.toLowerCase().includes('xml') || l.text.toLowerCase().includes('descarg'));
  const tables = document.querySelectorAll('table');
  result.tableCount = tables.length;
  const tableInfo = [];
  tables.forEach((t, i) => {
    const headers = Array.from(t.querySelectorAll('th')).map(th => th.textContent.trim());
    if (headers.length > 1) tableInfo.push({ index: i, headers });
  });
  result.tables = tableInfo;
  // Check for any download buttons
  const allLinks = Array.from(document.querySelectorAll('a')).map(a => ({ text: a.textContent.trim().substring(0,60), href: a.href }));
  result.allLinks = allLinks.filter(l => l.text);
  return result;
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
