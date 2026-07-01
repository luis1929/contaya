import { chromium } from 'playwright';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
await page.goto('https://plataforma.facturatech.co/login/', { timeout: 60000, waitUntil: 'load' });
await page.waitForTimeout(2000);
await page.fill('input[type="text"]', '900948052');
await page.fill('input[type="password"]', 'Esquivel2026$');
await page.click('button[type="submit"]');
await page.waitForTimeout(8000);
// Try XML download
const response = await page.goto('https://plataforma.facturatech.co/comprobantes21/descargas/?tipo=xml&idCom=98098173&idUs=216800', { timeout: 60000, waitUntil: 'load' });
// Check content type
const contentType = response.headers()['content-type'];
console.log('Content-Type:', contentType);
// Get the beginning of the response body
const text = await response.text();
console.log('Response length:', text.length);
console.log('First 500 chars:', text.substring(0, 500));
await browser.close();
