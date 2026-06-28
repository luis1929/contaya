import { extractInvoices, extractInvoiceDetail } from './extractors/invoices.js';
import { extractClients } from './extractors/clients.js';
import { extractItems } from './extractors/items.js';
import { extractConfig } from './extractors/config.js';
import { sleep } from './browser.js';

export async function fullSync(page, options = {}) {
  const {
    extractInvoices: doInvoices = true,
    extractClients: doClients = true,
    extractItems: doItems = true,
    extractConfig: doConfig = true,
    extractDetails: doDetails = false,
    detailBatchSize = 10,
  } = options;

  const result = {};

  if (doInvoices) {
    console.log('\n========== EXTRACT: INVOICES ==========');
    try {
      result.invoices = await extractInvoices(page);
      console.log(`[sync] Invoices: ${result.invoices.length} registros`);
    } catch (err) {
      console.error(`[sync] Invoices FAILED: ${err.message}`);
      result.invoices = { error: err.message };
    }
  }

  if (doClients) {
    console.log('\n========== EXTRACT: CLIENTS ==========');
    try {
      result.clients = await extractClients(page);
      console.log(`[sync] Clients: ${result.clients.length} registros`);
    } catch (err) {
      console.error(`[sync] Clients FAILED: ${err.message}`);
      result.clients = { error: err.message };
    }
  }

  if (doItems) {
    console.log('\n========== EXTRACT: ITEMS ==========');
    try {
      result.items = await extractItems(page);
      console.log(`[sync] Items: ${result.items.length} registros`);
    } catch (err) {
      console.error(`[sync] Items FAILED: ${err.message}`);
      result.items = { error: err.message };
    }
  }

  if (doConfig) {
    console.log('\n========== EXTRACT: CONFIG ==========');
    try {
      result.config = await extractConfig(page);
      console.log(`[sync] Config: OK`);
    } catch (err) {
      console.error(`[sync] Config FAILED: ${err.message}`);
      result.config = { error: err.message };
    }
  }

  if (doDetails && Array.isArray(result.invoices) && result.invoices.length > 0) {
    console.log('\n========== EXTRACT: INVOICE DETAILS ==========');
    const itemsWithInvoice = [];
    let processed = 0;
    let errors = 0;

    for (let i = 0; i < result.invoices.length; i += detailBatchSize) {
      const batch = result.invoices.slice(i, i + detailBatchSize);
      for (const inv of batch) {
        try {
          const detail = await extractInvoiceDetail(page, inv);
          if (detail && detail.items && detail.items.length > 0) {
            for (const item of detail.items) {
              itemsWithInvoice.push({ ...item, _ncf: inv.ncf });
            }
          }
          processed++;
        } catch (err) {
          console.error(`[sync] Detail FAILED for ${inv.ncf}: ${err.message}`);
          errors++;
        }
        await sleep(1000);
      }
      console.log(`[sync] Detail progress: ${processed}/${result.invoices.length} invoices, ${itemsWithInvoice.length} line items`);
    }

    result.invoice_details = { items: itemsWithInvoice };
    console.log(`[sync] Invoice details done: ${processed} invoices, ${itemsWithInvoice.length} line items, ${errors} errors`);
  }

  return result;
}
