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
const info = await page.evaluate(() => {
  const sel = document.querySelector('#tipo_nota');
  if (!sel) return 'not found';
  const rect = sel.getBoundingClientRect();
  const style = window.getComputedStyle(sel);
  return {
    visible: rect.width > 0 && rect.height > 0,
    display: style.display,
    visibility: style.visibility,
    rect: { w: rect.width, h: rect.height, top: rect.top, left: rect.left },
    value: sel.value
  };
});
console.log('Select visibility:', JSON.stringify(info, null, 2));
// Also try selecting
try {
  await page.selectOption('#tipo_nota', 'NC');
  console.log('Select NC succeeded');
  await page.waitForTimeout(2000);
  const newVal = await page.evaluate(() => document.querySelector('#tipo_nota')?.value);
  console.log('New value:', newVal);
} catch (e) {
  console.log('Select NC failed:', e.message.substring(0, 200));
}
await browser.close();
