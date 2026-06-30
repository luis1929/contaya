import fs from 'fs';

function parseTotal(s) {
  if (!s) return null;
  const cleaned = String(s).replace(/[^0-9,.\-]/g, '').replace(/,/g, '');
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function parseDate(s) {
  if (!s) return null;
  const parts = s.split('/');
  if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return s;
}

async function upsertItems(pool, items, billerId) {
  if (!items?.length) return { inserted: 0, updated: 0 };

  let inserted = 0, updated = 0;
  for (const item of items) {
    if (!item.code) continue;
    const price = parseTotal(item.price) || 0;
    try {
      const { rowCount } = await pool.query(
        `INSERT INTO items (biller_id, code, description, unit_value)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (biller_id, code) WHERE code IS NOT NULL
         DO UPDATE SET description=EXCLUDED.description, unit_value=EXCLUDED.unit_value, updated_at=NOW()`,
        [billerId, item.code, item.name, price]
      );
      if (rowCount === 1) inserted++;
      else updated++;
    } catch (err) {
      console.error(`  [items] Error con código ${item.code}: ${err.message}`);
    }
  }
  return { inserted, updated };
}

async function upsertClients(pool, clients, billerId) {
  if (!clients?.length) return { inserted: 0, updated: 0 };

  let inserted = 0, updated = 0;
  for (const client of clients) {
    if (!client.document) continue;
    try {
      const { rowCount } = await pool.query(
        `INSERT INTO clients (biller_id, name, email, phone, address, document, ciudad)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (biller_id, document) WHERE document IS NOT NULL
         DO UPDATE SET name=EXCLUDED.name, email=EXCLUDED.email, phone=EXCLUDED.phone,
           address=EXCLUDED.address, ciudad=EXCLUDED.ciudad, updated_at=NOW()`,
        [billerId, client.name, client.email, client.phone, client.address, client.document, client.city]
      );
      if (rowCount === 1) inserted++;
      else updated++;
    } catch (err) {
      console.error(`  [clientes] Error con doc ${client.document}: ${err.message}`);
    }
  }
  return { inserted, updated };
}

async function upsertInvoices(pool, invoices, billerId) {
  if (!invoices?.length) return { inserted: 0, updated: 0 };

  let inserted = 0, updated = 0;
  for (const inv of invoices) {
    if (!inv.ncf) continue;
    const total = parseTotal(inv.total);
    const fecha = parseDate(inv.date);

    let xmlContent = null;
    if (inv._xml_path && fs.existsSync(inv._xml_path)) {
      xmlContent = fs.readFileSync(inv._xml_path, 'utf8');
    }

    try {
      const { rowCount } = await pool.query(
        `INSERT INTO invoices (biller_id, ncf, client, doc_type, created_at, total, status,
           xml_content, has_xml)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (biller_id, ncf) WHERE ncf IS NOT NULL
         DO UPDATE SET client=EXCLUDED.client, doc_type=EXCLUDED.doc_type, created_at=EXCLUDED.created_at,
           total=EXCLUDED.total, status=EXCLUDED.status,
           xml_content=EXCLUDED.xml_content, has_xml=EXCLUDED.has_xml, updated_at=NOW()`,
        [billerId, inv.ncf, inv.client, inv.doc_type, fecha, total, inv.status,
         xmlContent, xmlContent ? true : false]
      );
      if (rowCount === 1) inserted++;
      else updated++;
    } catch (err) {
      console.error(`  [comprobantes] Error con NCF ${inv.ncf}: ${err.message}`);
    }
  }
  return { inserted, updated };
}

export async function persistAll(pool, syncResult, billerId) {
  const results = {};

  console.log('[persist] Items...');
  results.items = await upsertItems(pool, syncResult.items, billerId);
  console.log(`  → ${results.items.inserted} insertados, ${results.items.updated} actualizados`);

  console.log('[persist] Clientes...');
  results.clients = await upsertClients(pool, syncResult.clients, billerId);
  console.log(`  → ${results.clients.inserted} insertados, ${results.clients.updated} actualizados`);

  console.log('[persist] Comprobantes...');
  results.invoices = await upsertInvoices(pool, syncResult.invoices, billerId);
  console.log(`  → ${results.invoices.inserted} insertados, ${results.invoices.updated} actualizados`);

  return results;
}
