import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const context = await browser.newContext();
const page = await context.newPage();

// Handle the download
page.on('download', async download => {
  const path = await download.path();
  const fs = await import('fs');
  const content = fs.readFileSync(path, 'utf-8');
  console.log('Content length:', content.length);
  console.log('First 800 chars:', content.substring(0, 800));
  console.log('Has InvoiceLine:', content.includes('InvoiceLine'));
  console.log('Has items:', content.includes('<Item'));
});

await page.goto('https://plataforma.facturatech.co/login/', { timeout: 60000, waitUntil: 'load' });
await page.waitForTimeout(2000);
await page.fill('input[type="text"]', '900948052');
await page.fill('input[type="password"]', 'Esquivel2026$');
await page.click('button[type="submit"]');
await page.waitForTimeout(8000);
// Go directly to XML download
const fullUrl = 'https://plataforma.facturatech.co/comprobantes21/descargas/?tipo=xml&idCom=98098173&idUs=216800';
console.log('Fetching:', fullUrl);
const response = await page.goto(fullUrl, { timeout: 60000, waitUntil: 'load' });
console.log('Response status:', response.status());
console.log('Content-Type:', response.headers()['content-type']);
const text = await response.text();
console.log('Response text length:', text.length);
console.log('First 500:', text.substring(0, 500));
await browser.close();
