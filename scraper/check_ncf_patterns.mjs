import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('https://plataforma.facturatech.co/login/', { timeout: 60000, waitUntil: 'load' });
await page.waitForTimeout(2000);
await page.fill('input[type="text"]', '900948052');
await page.fill('input[type="password"]', 'Esquivel2026$');
await page.click('button[type="submit"]');
await page.waitForTimeout(8000);
await page.goto('https://plataforma.facturatech.co/comprobantes21/?se=15', { timeout: 60000, waitUntil: 'load' });
await page.waitForTimeout(3000);
// Get all unique NCF patterns from the table
const ncfPatterns = await page.evaluate(() => {
  const tables = document.querySelectorAll('table');
  let target = null;
  for (const t of tables) {
    if (t.querySelectorAll('tr').length > 3) {
      const text = t.textContent.toLowerCase();
      if (text.indexOf('numeracion') !== -1 && text.indexOf('cliente') !== -1) {
        target = t;
        break;
      }
    }
  }
  if (!target) return null;
  const rows = target.querySelectorAll('tr');
  const nfcs = [];
  for (let r = 1; r < Math.min(rows.length, 10); r++) {
    const cells = rows[r].querySelectorAll('td');
    if (cells.length > 1) {
      const ncf = cells[1]?.textContent?.trim();
      const total = cells[4]?.textContent?.trim();
      const status = cells[5]?.textContent?.trim();
      nfcs.push({ ncf, total, status });
    }
  }
  return nfcs;
});
console.log('NCF patterns:', JSON.stringify(ncfPatterns, null, 2));
await browser.close();
