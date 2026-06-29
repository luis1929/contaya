import pg from 'pg';
import crypto from 'crypto';
import { createAuthenticatedSession } from './lib/auth.js';
import { closeSession, sleep } from './lib/browser.js';
import { extractInvoiceDetail } from './lib/extractors/invoices.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { encrypt, decrypt } = require('../backend/services/cryptoService.js');

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

async function getCredentials(billerId) {
  const userArg = getArg('user');
  const passArg = getArg('pass');
  if (userArg && passArg) return { username: userArg, password: passArg };
  if (process.env.FACTURATECH_USER && process.env.FACTURATECH_PASS) {
    return { username: process.env.FACTURATECH_USER, password: process.env.FACTURATECH_PASS };
  }
  const { rows } = await pool.query(
    `SELECT username_encrypted, password_encrypted FROM biller_credentials WHERE biller_id = $1 AND is_configured = true`,
    [billerId]
  );
  if (!rows.length) throw new Error('No credentials configured for this biller');
  return {
    username: decrypt(rows[0].username_encrypted),
    password: decrypt(rows[0].password_encrypted),
  };
}

async function getInvoicesWithoutItems(billerId, limit = 50) {
  const { rows } = await pool.query(`
    SELECT i.id, i.ncf, i.raw_data->>'_internal_id' AS internal_id,
           i.raw_data->>'_folio' AS folio, i.raw_data->>'_prefijo' AS prefijo
    FROM invoices i
    WHERE i.biller_id = $1
      AND i.raw_data ? '_internal_id'
      AND NOT EXISTS (SELECT 1 FROM invoice_items ii WHERE ii.invoice_id = i.id)
    ORDER BY i.created_at DESC
    LIMIT $2
  `, [billerId, limit]);
  return rows;
}

async function getBillerIds() {
  const specified = getArg('biller-id');
  if (specified) return [specified];
  const { rows } = await pool.query(
    `SELECT bc.biller_id FROM biller_credentials bc WHERE bc.is_configured = true`
  );
  return rows.map(r => r.biller_id);
}

function parseTotal(s) {
  if (!s) return 0;
  const cleaned = String(s).replace(/[^0-9,.\-]/g, '').replace(/,/g, '');
  return parseFloat(cleaned) || 0;
}

async function storeInvoiceItems(invoiceId, items, ncf) {
  let inserted = 0;
  for (const item of items) {
    const code = item.code || item.identificador || null;
    const desc = item.description || item.descripcion || item.name || item.nombre || '';
    const qty = parseFloat(item.quantity || item.cantidad || item.cant || 1) || 1;
    const unitPrice = parseTotal(item.unit_price || item.precio_unitario || item.valor_unitario || item.unitario || item.precio || 0) || 0;
    const ivaPct = parseFloat(item.iva_percentage || item.iva || 0) || 0;
    const retPct = parseFloat(item.retention_percentage || item.retencion || 0) || 0;
    const total = parseTotal(item.total || item.valor || 0) || (qty * unitPrice);

    try {
      await pool.query(
        `INSERT INTO invoice_items
           (invoice_id, code, description, quantity, unit_price,
            iva_percentage, retention_percentage, total)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [invoiceId, code, desc, qty, unitPrice, ivaPct, retPct, total]
      );
      inserted++;
    } catch (err) {
      console.error(`  [store] Error inserting item for invoice ${ncf}: ${err.message}`);
    }
  }
  return inserted;
}

async function extractForBiller(page, billerId) {
  console.log(`\n========== EXTRACTING ITEMS FOR BILLER ${billerId} ==========`);
  const invoices = await getInvoicesWithoutItems(billerId, 200);
  console.log(`[extract] ${invoices.length} invoices without items`);

  let processed = 0;
  let totalItems = 0;
  let errors = 0;

  for (const inv of invoices) {
    const internalId = inv.internal_id;
    if (!internalId) {
      console.log(`[extract] ${inv.ncf}: no internal_id, skipping`);
      continue;
    }

    const fakeInvoice = {
      ncf: inv.ncf,
      _internal_id: internalId,
      _folio: inv.folio,
      _prefijo: inv.prefijo,
      _id_comprobante: null,
    };

    try {
      const detail = await extractInvoiceDetail(page, fakeInvoice, { timeout: 20000 });
      if (detail && detail.items && detail.items.length > 0) {
        const stored = await storeInvoiceItems(inv.id, detail.items, inv.ncf);
        totalItems += stored;
        console.log(`[extract] ${inv.ncf}: ${detail.items.length} items extracted, ${stored} stored`);
      } else {
        console.log(`[extract] ${inv.ncf}: no items found`);
      }
      processed++;
    } catch (err) {
      console.error(`[extract] ${inv.ncf} FAILED: ${err.message}`);
      errors++;
    }

    await sleep(1500);
  }

  console.log(`\n[extract] Done for biller ${billerId}: ${processed} processed, ${totalItems} items, ${errors} errors`);
  return { processed, totalItems, errors };
}

async function main() {
  console.log('[extract-items] Starting...');

  const billerIds = await getBillerIds();
  if (!billerIds.length) {
    console.log('[extract-items] No billers with credentials found');
    await pool.end();
    return;
  }

  let session;
  try {
    const creds = await getCredentials(billerIds[0]);
    session = await createAuthenticatedSession(
      { username: creds.username, password: creds.password },
      { headless: true, retries: 2 }
    );

    for (const bid of billerIds) {
      await extractForBiller(session.page, bid);
    }

    console.log('\n[extract-items] All done');
  } catch (err) {
    console.error('[extract-items] Fatal error:', err.message);
    if (session?.page) {
      await session.page.screenshot({ path: '/tmp/contaya/extract_error.png' }).catch(() => {});
    }
  } finally {
    if (session) await closeSession(session);
    await pool.end().catch(() => {});
  }
}

main();
