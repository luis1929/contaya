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

// Find the first NCF link and click it
const ncfLink = await page.evaluate(() => {
  const links = document.querySelectorAll('table:nth-child(2) tbody tr td a, table tbody tr td a');
  // Find links that look like NCF numbers
  for (const a of links) {
    const text = a.textContent.trim();
    if (text.includes('-')) return { text, href: a.href };
  }
  return null;
});
console.log('NCF link found:', JSON.stringify(ncfLink));

if (ncfLink && ncfLink.href) {
  await page.goto(ncfLink.href, { timeout: 30000, waitUntil: 'networkidle' });
  await page.waitForTimeout(3000);
  console.log('Detail URL:', page.url());
  
  const info = await page.evaluate(() => {
    const result = {};
    // Get all download/action links
    const links = Array.from(document.querySelectorAll('a')).map(a => ({ text: a.textContent.trim().substring(0, 80), href: a.href }));
    result.actionLinks = links.filter(l => l.text);
    // Get all tables 
    const tables = document.querySelectorAll('table');
    const tableInfo = [];
    tables.forEach((t, i) => {
      const headers = Array.from(t.querySelectorAll('th')).map(th => th.textContent.trim());
      const rows = [];
      t.querySelectorAll('tbody tr').forEach(tr => {
        const cells = Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim().substring(0, 40));
        if (cells.length > 1) rows.push(cells);
      });
      if (headers.length > 1 || rows.length > 0) {
        tableInfo.push({ index: i, headers, rows: rows.slice(0, 3) });
      }
    });
    result.tables = tableInfo;
    // Check for PDF/XML download buttons
    const allElements = document.querySelectorAll('a, button, input[type="submit"]');
    const downloadItems = [];
    allElements.forEach(el => {
      const text = el.textContent?.trim() || el.value || '';
      const href = el.href || '';
      if (text.toLowerCase().includes('pdf') || text.toLowerCase().includes('xml') || text.toLowerCase().includes('descarg') || href.includes('.pdf') || href.includes('.xml')) {
        downloadItems.push({ text: text.substring(0, 50), href: href.substring(0, 100) });
      }
    });
    result.downloadItems = downloadItems;
    return result;
  });
  console.log(JSON.stringify(info, null, 2));
}
await browser.close();
