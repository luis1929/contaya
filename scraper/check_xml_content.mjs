import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('https://plataforma.facturatech.co/login/', { timeout: 60000, waitUntil: 'load' });
await page.waitForTimeout(2000);
await page.fill('input[type="text"]', '900948052');
await page.fill('input[type="password"]', 'Esquivel2026$');
await page.click('button[type="submit"]');
await page.waitForTimeout(8000);
// Download XML
const [download] = await Promise.all([
  page.waitForEvent('download', { timeout: 30000 }),
  page.click('a[href*="tipo=xml"]')
]);
const path = await download.path();
console.log('Download path:', path);
const fs = await import('fs');
const content = fs.readFileSync(path, 'utf-8');
console.log('Content length:', content.length);
console.log('First 800 chars:', content.substring(0, 800));
console.log('Has InvoiceLine:', content.includes('InvoiceLine'));
console.log('Has items:', content.includes('<Item'));
console.log('Has cantidad:', content.includes('cantidad') || content.includes('Cantidad') || content.includes('quantity') || content.includes('Quantity'));
console.log('Has descripcion:', content.toLowerCase().includes('descripcion') || content.toLowerCase().includes('description'));
await browser.close();
