import { chromium } from "playwright";

const USER = "72005672";
const PASS = "Ortega2026$";

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

await page.goto("https://plataforma.facturatech.co/login/", { timeout: 30000, waitUntil: "networkidle" });
await new Promise(r => setTimeout(r, 2000));
await page.fill("input[type=\"text\"]", USER);
await page.fill("input[type=\"password\"]", PASS);
await page.click("button[type=\"submit\"]");
await new Promise(r => setTimeout(r, 5000));

// Go to billing data page
await page.goto("https://plataforma.facturatech.co/datos_facturacion21/", { timeout: 30000, waitUntil: "networkidle" });
await new Promise(r => setTimeout(r, 3000));

const info = await page.evaluate(() => {
  const body = document.body.innerText;
  const inputs = Array.from(document.querySelectorAll("input, select, textarea")).map(el => ({
    id: el.id, name: el.name, type: el.type || el.tagName,
    value: el.value, placeholder: el.placeholder,
    label: document.querySelector(`label[for="${el.id}"]`)?.textContent?.trim()
  }));
  return { body: body.substring(0, 3000), inputs };
});

console.log("=== PAGE BODY ===");
console.log(info.body);
console.log("\n=== FORM INPUTS ===");
info.inputs.forEach(i => console.log(`  ${i.label || i.id || i.name}: ${i.value || '(empty)'}`));

await page.screenshot({ path: "/tmp/biller_info.png", fullPage: true });
console.log("\nScreenshot saved");

await browser.close();
