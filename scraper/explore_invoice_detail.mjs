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
// Get the comprobantes table rows, find NCF links
const info = await page.evaluate(() => {
  const table = document.querySelector('table');
  if (!table) return { error: 'no table' };
  const rows = Array.from(table.querySelectorAll('tbody tr'));
  const firstRows = rows.slice(0, 3).map(row => {
    const cells = Array.from(row.querySelectorAll('td'));
    const links = Array.from(row.querySelectorAll('a')).map(a => ({ text: a.textContent.trim(), href: a.href }));
    return {
      cellTexts: cells.map(c => c.textContent.trim().substring(0, 80)),
      links: links.filter(l => l.text && l.href)
    };
  });
  // Get table headers
  const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim());
  return { headers, firstRows };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
