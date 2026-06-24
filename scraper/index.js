import { chromium } from 'playwright';
import pg from 'pg';
import bcrypt from 'bcryptjs';

const { Pool } = pg;
const pool = new Pool({
  user: process.env.DB_USER || 'contaya',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'contaya',
  password: process.env.DB_PASSWORD || 'contaya123',
  port: parseInt(process.env.DB_PORT || '5432'),
});

const USER = process.argv.find(a => a.startsWith('--user='))?.split('=')[1] || process.env.FACTURATECH_USER || '72005672';
const PASS = process.argv.find(a => a.startsWith('--pass='))?.split('=')[1] || process.env.FACTURATECH_PASS || 'Ortega2026$';
const BILLER_ID = process.argv.find(a => a.startsWith('--biller-id='))?.split('=')[1] || null;

async function setScrapeStatus(status, errorMsg = null) {
  if (!BILLER_ID) return;
  try {
    await pool.query(
      `UPDATE billers SET scrape_status=$1, scrape_last_run=NOW(), scrape_error=$2 WHERE id=$3`,
      [status, errorMsg, BILLER_ID]
    );
  } catch (e) {
    console.error('[scraper] Failed to update scrape_status:', e.message);
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function parseTotal(s) {
  if (!s) return null;
  const cleaned = s.replace(/[^0-9,.]/g, '').replace(/,/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function parseDate(s) {
  if (!s) return null;
  const parts = s.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
  }
  return s;
}

function cleanClientName(raw) {
  if (!raw) return null;
  return raw.split('...')[0].trim();
}

async function scrapeTable(page) {
  return page.evaluate(() => {
    const tables = document.querySelectorAll('table');
    let targetTable = null;
    for (const t of tables) {
      const firstRow = t.querySelector('tbody tr');
      if (!firstRow) continue;
      const cells = Array.from(firstRow.querySelectorAll('td, th')).map(c => c.textContent.trim());
      const text = cells.join(' ');
      if (text.includes('Numeración') && text.includes('Cliente')) {
        targetTable = t;
        break;
      }
    }
    if (!targetTable) return null;

    const rows = targetTable.querySelectorAll('tbody tr');
    const data = [];
    for (let i = 1; i < rows.length; i++) {
      const cols = rows[i].querySelectorAll('td');
      const cells = Array.from(cols).map(c => c.textContent.trim());
      if (cells.length < 5) continue;
      const numeracion = cells[1] || '';
      if (!numeracion) continue;
      data.push({
        numeracion,
        cliente: cells[2] || '',
        fecha: cells[3] || '',
        total_text: cells[4] || '',
        estatus: cells[5] || '',
        pagado: (cells[7] || '').toLowerCase(),
      });
    }
    return data;
  });
}

async function scrapeAllPages(page) {
  const baseUrl = 'https://plataforma.facturatech.co/comprobantes21/?se=15';
  let allDocs = new Map();

  await page.goto(baseUrl, { timeout: 30000, waitUntil: 'networkidle' });
  await sleep(5000);

  await page.selectOption('#registros', '100');
  await sleep(5000);

  for (let p = 0; p < 15; p++) {
    const data = await scrapeTable(page);
    if (!data || data.length === 0) {
      console.log(`Page ${p + 1}: no data, stopping`);
      break;
    }

    let newCount = 0;
    for (const row of data) {
      if (!allDocs.has(row.numeracion)) {
        allDocs.set(row.numeracion, row);
        newCount++;
      }
    }
    console.log(`Page ${p + 1}: ${data.length} items, ${newCount} new (total: ${allDocs.size})`);

    const hasNext = await page.evaluate(() => {
      const links = document.querySelectorAll('a');
      for (const link of links) {
        if (link.textContent.trim() === 'Siguiente') {
          const parent = link.closest('li') || link.parentElement;
          return !parent.classList.contains('disabled');
        }
      }
      return false;
    });

    if (!hasNext) break;
    await page.click('a:has-text("Siguiente")');
    await sleep(5000);
  }

  return allDocs;
}

async function scrapeBillerInfo(page) {
  if (!BILLER_ID) {
    console.log('No biller_id provided, skipping biller info update');
    return;
  }
  try {
    console.log('Scraping biller info from config page...');
    await page.goto('https://plataforma.facturatech.co/datos_facturacion21/', { timeout: 30000, waitUntil: 'networkidle' });
    await sleep(3000);

    const data = await page.evaluate(() => {
      const inputs = {};
      document.querySelectorAll('input, select').forEach(el => {
        if (el.id && el.value) inputs[el.id] = el.value.trim();
      });
      return inputs;
    });

    const individualName = [data.primer_nombre_emi, data.segundo_nombre_emi, data.primer_apellido_emi, data.segundo_apellido_emi]
      .filter(Boolean).join(' ').trim();
    const name = individualName || data['razon_social'] || data['nombre_comercial_emi'] || null;
    const email = data['email'] || data['email_facturacion'] || data['email_contacto'] || null;
    const phone = data['telefono'] || data['telefono2'] || data['telefono_fijo'] || data['celular'] || null;
    const address = data['direccion'] || null;
    const city = data['ciudad'] || null;
    const docNum = data['nit'] ? data['nit'] + (data['dv'] ? '-' + data['dv'] : '') : null;

    const hashedPassword = await bcrypt.hash(PASS, 10);

    const client = await pool.connect();
    try {
      await client.query(
        `UPDATE billers SET name=$1, email=$2, phone=$3, address=$4, city=$5,
         document_number=COALESCE($6, document_number), password=$7, updated_at=NOW() WHERE id=$8`,
        [name || null, email, phone, address, city, docNum, hashedPassword, BILLER_ID]
      );
      console.log(`Updated biller ${BILLER_ID}: name="${name || '?'}", email="${email}", phone="${phone}"`);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error scraping biller info:', err.message);
  }
}

async function scrape() {
  console.log(`Starting scrape for user: ${USER}, biller_id: ${BILLER_ID || 'auto'}`);

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  try {
    console.log('Logging in...');
    await page.goto('https://plataforma.facturatech.co/login/', { timeout: 30000, waitUntil: 'networkidle' });
    await sleep(2000);
    await page.fill('input[type="text"]', USER);
    await page.fill('input[type="password"]', PASS);
    await page.click('button[type="submit"]');
    await sleep(5000);
    console.log('Logged in:', page.url());

    console.log('Scraping all pages...');
    const allDocs = await scrapeAllPages(page);
    console.log(`Total unique documents found: ${allDocs.size}`);

    await scrapeBillerInfo(page);

    if (allDocs.size === 0) {
      console.log('No documents found');
      await setScrapeStatus('done');
      return;
    }

    const client = await pool.connect();
    try {
      let inserted = 0;
      let skipped = 0;
      for (const [ncf, row] of allDocs) {
        const exists = await client.query('SELECT id FROM invoices WHERE ncf = $1', [ncf]);
        if (exists.rows.length > 0) {
          skipped++;
          continue;
        }

        const docType = ncf.replace(/[^A-Z]/g, '');
        const clientName = cleanClientName(row.cliente);

        await client.query(
          `INSERT INTO invoices (ncf, client, client_name, doc_type, cufe, created_at, total, status, paid, raw_data, biller_id)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            ncf,
            row.cliente || null,
            clientName,
            docType,
            null,
            parseDate(row.fecha) || null,
            parseTotal(row.total_text),
            row.estatus || null,
            row.pagado.includes('si') || row.pagado.includes('check'),
            row,
            BILLER_ID,
          ]
        );
        inserted++;
      }
      console.log(`Inserted: ${inserted}, Skipped (already exist): ${skipped}`);
    } finally {
      client.release();
    }

    await page.screenshot({ path: '/tmp/facturatech_result.png', fullPage: true });
    console.log('\nDone — screenshot saved');
    await setScrapeStatus('done');
  } catch (err) {
    console.error('Error:', err.message);
    try { await page.screenshot({ path: '/tmp/facturatech_error.png' }); } catch (_) {}
    await setScrapeStatus('error', err.message);
  } finally {
    await browser.close();
    await pool.end();
  }
}

scrape();
