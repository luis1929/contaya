import { createPool, getBillers } from './lib/db.js';
import { createAuthenticatedSession } from './lib/auth.js';
import { closeSession, sleep } from './lib/browser.js';
import { extractInvoices } from './lib/extractors/invoices.js';
import { persistAll } from './lib/persist.js';

const pool = createPool();

async function processBiller(biller) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`BILLER: ${biller.name} (${biller.document_number})`);
  console.log(`${'='.repeat(60)}`);

  if (!biller.password) {
    console.log(`[skip] No credentials configured for ${biller.name}`);
    return { error: 'no credentials' };
  }

  let session;
  try {
    await pool.query(
      `UPDATE billers SET scrape_status='running', scrape_last_run=NOW() WHERE id=$1`,
      [biller.id]
    );

    session = await createAuthenticatedSession(
      { username: biller.username, password: biller.password },
      { headless: true, retries: 2 }
    );

    console.log(`\n--- Extrayendo Comprobantes ---`);
    const invoices = await extractInvoices(session.page);

    await closeSession(session);
    session = null;

    const syncResult = { invoices };

    console.log(`\n--- Persistiendo en BD ---`);
    await persistAll(pool, syncResult, biller.id);

    await pool.query(
      `UPDATE billers SET scrape_status='done', scrape_error=NULL WHERE id=$1`,
      [biller.id]
    );

    console.log(`[ok] ${biller.name} completado`);
    return { ok: true };
  } catch (err) {
    console.error(`[error] ${biller.name}: ${err.message}`);
    if (session?.page) {
      await session.page.screenshot({
        path: `/tmp/contaya/error_${biller.document_number}.png`
      }).catch(() => {});
    }
    await pool.query(
      `UPDATE billers SET scrape_status='error', scrape_error=$1 WHERE id=$2`,
      [err.message, biller.id]
    );
    return { error: err.message };
  } finally {
    if (session) await closeSession(session);
  }
}

async function main() {
  console.log('=== Contaya Scraper ===');

  const billers = await getBillers(pool);
  console.log(`Facturadores encontrados: ${billers.length}`);
  billers.forEach(b => console.log(`  - ${b.name} (${b.document_number})${b.password ? '' : ' [sin credenciales]'}`));

  const results = [];
  for (const biller of billers) {
    await sleep(5000);
    const r = await processBiller(biller);
    results.push(r);
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('RESUMEN:');
  billers.forEach((b, i) => {
    const r = results[i];
    const status = r?.ok ? 'OK' : `ERROR: ${r?.error || 'desconocido'}`;
    console.log(`  ${b.name}: ${status}`);
  });

  await pool.end();
  console.log('\n=== Scraper finalizado ===');
}

main().catch(err => {
  console.error('[fatal]', err.message);
  process.exit(1);
});
