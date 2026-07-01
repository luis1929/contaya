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
// Check the tipo_nota select
const selectInfo = await page.evaluate(() => {
  const el = document.querySelector('#tipo_nota');
  if (el) {
    return { tag: el.tagName, id: el.id, name: el.name, html: el.outerHTML.substring(0, 500) };
  }
  // Try other selectors
  const byName = document.querySelector('select[name="tipo_nota"]');
  if (byName) return { tag: byName.tagName, id: byName.id, name: byName.name, html: byName.outerHTML.substring(0, 500) };
  return null;
});
console.log('Select info:', JSON.stringify(selectInfo, null, 2));
await browser.close();
