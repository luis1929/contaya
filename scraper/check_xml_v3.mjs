import { chromium } from 'playwright';

async function checkXml() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  await page.goto('https://plataforma.facturatech.co/login/', { timeout: 60000, waitUntil: 'load' });
  await page.waitForTimeout(2000);
  await page.fill('input[type="text"]', '900948052');
  await page.fill('input[type="password"]', 'Esquivel2026$');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(8000);
  
  // Navigate to comprobantes page first, click the XML icon
  await page.goto('https://plataforma.facturatech.co/comprobantes21/?se=15', { timeout: 60000, waitUntil: 'load' });
  await page.waitForTimeout(3000);
  
  // Find XML download link on page
  const xmlLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('a[href*="tipo=xml"]'));
    return links.map(l => ({ href: l.href, text: l.textContent.trim() }));
  });
  console.log('XML links found:', xmlLinks.length);
  if (xmlLinks.length > 0) {
    console.log('First XML link href:', xmlLinks[0].href);
    // Click it
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 15000 }),
      page.click('a[href*="tipo=xml"]')
    ]);
    const path = await download.path();
    const fs = await import('fs');
    const content = fs.readFileSync(path, 'utf-8');
    console.log('Content length:', content.length);
    console.log('First 500 chars:', content.substring(0, 500));
    console.log('Has InvoiceLine:', content.includes('InvoiceLine'));
    console.log('Has Item:', content.includes('Item'));
  }
  
  await browser.close();
}
checkXml().catch(e => { console.error(e.message); process.exit(1); });
