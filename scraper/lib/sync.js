import { extractInvoices } from './extractors/invoices.js';
import { extractClients } from './extractors/clients.js';
import { extractItems } from './extractors/items.js';
import { extractConfig } from './extractors/config.js';

export async function fullSync(page, options = {}) {
  const {
    extractInvoices: doInvoices = true,
    extractClients: doClients = true,
    extractItems: doItems = true,
    extractConfig: doConfig = true,
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

  return result;
}
