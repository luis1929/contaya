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
  // Find all selects and their visibility
  const result = {};
  document.querySelectorAll('select').forEach(s => {
    const rect = s.getBoundingClientRect();
    const style = window.getComputedStyle(s);
    result[s.id || s.name || 'unnamed'] = {
      id: s.id,
      name: s.name,
      visible: rect.width > 0 && rect.height > 0,
      rect: { w: Math.round(rect.width), h: Math.round(rect.height), top: Math.round(rect.top), left: Math.round(rect.left) },
      options: Array.from(s.options).map(o => o.value).join(',')
    };
  });
  // Find the filter/sort container
  const containers = [];
  document.querySelectorAll('div, form, fieldset').forEach(el => {
    if (el.querySelectorAll('select').length >= 2) {
      const rect = el.getBoundingClientRect();
      containers.push({
        tag: el.tagName,
        id: el.id,
        class: el.className,
        visible: rect.width > 0 && rect.height > 10,
        rect: { w: Math.round(rect.width), h: Math.round(rect.height) }
      });
    }
  });
  result.containers = containers;
  return result;
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
