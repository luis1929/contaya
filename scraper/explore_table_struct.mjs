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

const info = await page.evaluate(() => {
  const tables = document.querySelectorAll('table');
  const t = tables[2];
  if (!t) return 'no table at index 2';
  // Get all direct children structure
  const children = [];
  t.childNodes.forEach(child => {
    if (child.tagName) {
      const rowCount = child.tagName === 'TBODY' ? child.querySelectorAll('tr').length : 
                        child.tagName === 'TR' ? 1 : 0;
      children.push({ tag: child.tagName, rowCount, html: child.innerHTML.substring(0, 200) });
    }
  });
  // Also get row count
  const allRows = t.querySelectorAll('tr');
  return { 
    childNodes: children, 
    totalRowCount: allRows.length,
    tableHTML: t.innerHTML.substring(0, 5000)
  };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
