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
// Find where tipo_nota is in the DOM and what's around it
const info = await page.evaluate(() => {
  const sel = document.querySelector('#tipo_nota');
  if (!sel) return 'not found';
  // Find the parent that might be hidden
  let el = sel;
  let depth = 0;
  const parents = [];
  while (el && depth < 10) {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    parents.push({
      tag: el.tagName,
      id: el.id,
      class: el.className.substring(0, 80),
      display: style.display,
      visible: rect.width > 0 && rect.height > 0
    });
    el = el.parentElement;
    depth++;
  }
  return parents;
});
console.log('Parent chain:', JSON.stringify(info, null, 2));

// Look for buttons/links that might show advanced filters
const buttons = await page.evaluate(() => {
  const els = [];
  document.querySelectorAll('a, button, input[type="button"]').forEach(el => {
    const text = (el.textContent || el.value || '').trim().toLowerCase();
    if (text.includes('filtro') || text.includes('avanzado') || text.includes('mostrar') || text.includes('ocultar') || text.includes('buscar')) {
      els.push({ text: el.textContent.trim(), tag: el.tagName, id: el.id, href: el.href });
    }
  });
  return els;
});
console.log('Filter buttons:', JSON.stringify(buttons, null, 2));
await browser.close();
