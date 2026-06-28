import pg from 'pg';
import { createAuthenticatedSession } from './lib/auth.js';
import { closeSession } from './lib/browser.js';
import { fullSync } from './lib/sync.js';
import { persistAll } from './lib/persist.js';

const { Pool } = pg;
const pool = new Pool({
  user: process.env.DB_USER || 'contaya',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'contaya',
  password: process.env.DB_PASSWORD || 'contaya123',
  port: parseInt(process.env.DB_PORT || '5432'),
});

function getArg(name) {
  const arg = process.argv.find(a => a.startsWith(`--${name}=`));
  return arg ? arg.split('=')[1] : null;
}

const USER = getArg('user') || process.env.FACTURATECH_USER || '72005672';
const PASS = getArg('pass') || process.env.FACTURATECH_PASS || 'Ortega2026$';
const BILLER_ID = getArg('biller-id') || null;
const OUTPUT = getArg('output') || null;

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

async function scrape() {
  console.log(`[scraper] Starting sync — user: ${USER}, biller: ${BILLER_ID || 'auto'}`);

  let session;
  try {
    if (BILLER_ID) {
      await setScrapeStatus('running');
    }

    session = await createAuthenticatedSession(
      { username: USER, password: PASS },
      { headless: true, retries: 2 }
    );

    const syncResult = await fullSync(session.page);

    if (OUTPUT) {
      const fs = await import('fs');
      const dir = OUTPUT.substring(0, OUTPUT.lastIndexOf('/'));
      if (dir) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(OUTPUT, JSON.stringify(syncResult, null, 2));
      console.log(`[scraper] Output saved to ${OUTPUT}`);
    }

    console.log('\n========== SYNC COMPLETE ==========');
    for (const [key, val] of Object.entries(syncResult)) {
      if (val && !val.error) {
        console.log(`  ${key}: ${Array.isArray(val) ? val.length + ' registros' : 'OK'}`);
      }
      if (val && val.error) {
        console.log(`  ${key}: ERROR — ${val.error}`);
      }
    }

    if (BILLER_ID) {
      await persistAll(pool, syncResult, BILLER_ID);
    }

    if (BILLER_ID) {
      await setScrapeStatus('done');
    }
    console.log('[scraper] Done');
  } catch (err) {
    console.error('[scraper] Error:', err.message);
    if (session?.page) {
      await session.page.screenshot({ path: '/tmp/contaya/scraper_error.png' }).catch(() => {});
    }
    if (BILLER_ID) {
      await setScrapeStatus('error', err.message);
    }
  } finally {
    if (session) await closeSession(session);
    await pool.end().catch(() => {});
  }
}

scrape();
