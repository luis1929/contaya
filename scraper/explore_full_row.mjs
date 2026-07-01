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
  const rows = t.querySelectorAll('tr');
  const dataRow = rows[1]; // Second tr (first after header)
  // Get all links, images, onclick handlers in the row
  const allLinks = Array.from(dataRow.querySelectorAll('a')).map(a => ({
    text: a.textContent.trim(),
    href: a.href,
    onclick: a.getAttribute('onclick')?.substring(0, 200) || '',
    id: a.id,
    className: a.className
  }));
  
  // Get all images
  const imgs = Array.from(dataRow.querySelectorAll('img')).map(img => ({
    src: img.src,
    title: img.title,
    width: img.width
  }));
  
  // Get onclicks on td
  const tds = Array.from(dataRow.querySelectorAll('td')).map((td, i) => ({
    index: i,
    html: td.innerHTML.substring(0, 300),
    text: td.textContent.trim().substring(0, 80)
  }));
  
  return { allLinks: allLinks.filter(l => l.text || l.onclick), imgs, tds };
});
console.log(JSON.stringify(info, null, 2));
await browser.close();
