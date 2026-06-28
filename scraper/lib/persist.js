import pg from 'pg';

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
  return s;
}

function cleanClientName(raw) {
  if (!raw) return null;
  return raw.split('...')[0].trim() || null;
}

export async function persistInvoices(pool, rows, billerId) {
  if (!Array.isArray(rows) || rows.length === 0) return { inserted: 0, updated: 0, errors: 0 };

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const row of rows) {
    const ncf = row.ncf;
    if (!ncf) continue;

    const docType = ncf.replace(/[^A-Z]/g, '') || null;
    const fecha = parseDate(row.date || row.fecha);
    const total = parseTotal(row.total || row.valor);
    const paid = (row.paid || row.pagado || '').toLowerCase().includes('si');
    const cufe = (row.client || '').includes('...')
      ? (row.client.match(/[a-f0-9]{50,}/) || [null])[0]
      : null;
    const rawClean = { ...row };
    delete rawClean[''];

    try {
      const { rows: [existing] } = await pool.query(
        `SELECT id FROM invoices WHERE biller_id = $1 AND ncf = $2`,
        [billerId, ncf]
      );

      if (existing) {
        await pool.query(
          `UPDATE invoices
             SET client=$1, client_name=$2, doc_type=$3, created_at=$4,
                 total=$5, status=$6, paid=$7, raw_data=$8, cufe=$9, updated_at=NOW()
           WHERE id = $10`,
          [
            row.client || null,
            cleanClientName(row.client) || row.client_name || null,
            docType,
            fecha,
            total,
            row.status || row.estatus || row.estado || null,
            paid,
            JSON.stringify(rawClean),
            cufe,
            existing.id,
          ]
        );
        updated++;
      } else {
        await pool.query(
          `INSERT INTO invoices
             (biller_id, ncf, client, client_name, doc_type, created_at,
              total, status, paid, raw_data, cufe, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
          [
            billerId,
            ncf,
            row.client || null,
            cleanClientName(row.client) || null,
            docType,
            fecha,
            total,
            row.status || row.estatus || row.estado || null,
            paid,
            JSON.stringify(rawClean),
            cufe,
          ]
        );
        inserted++;
      }
    } catch (err) {
      console.error(`[persist] Error inserting invoice ncf=${ncf}: ${err.message}`);
      errors++;
    }
  }

  return { inserted, updated, errors };
}

export async function persistClients(pool, rows, billerId) {
  if (!Array.isArray(rows) || rows.length === 0) return { inserted: 0, updated: 0, errors: 0 };

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const row of rows) {
    const docNum = row.document_number || row.nit || row.identificacion || row.document || row.rnc;
    if (!docNum) continue;

    try {
      const { rows: [existing] } = await pool.query(
        `SELECT id FROM clients WHERE biller_id = $1 AND document = $2`,
        [billerId, docNum]
      );

      if (existing) {
        await pool.query(
          `UPDATE clients
             SET name=$1, email=$2, phone=$3, address=$4, ciudad=$5, updated_at=NOW()
           WHERE id = $6`,
          [
            row.name || row.client || null,
            row.email || null,
            row.phone || row.celular || null,
            row.address || row.direccion || null,
            row.city || row.ciudad || null,
            existing.id,
          ]
        );
        updated++;
      } else {
        await pool.query(
          `INSERT INTO clients
             (biller_id, name, email, phone, address, document, ciudad)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            billerId,
            row.name || row.client || null,
            row.email || null,
            row.phone || row.celular || null,
            row.address || row.direccion || null,
            docNum,
            row.city || row.ciudad || null,
          ]
        );
        inserted++;
      }
    } catch (err) {
      console.error(`[persist] Error upserting client doc=${docNum}: ${err.message}`);
      errors++;
    }
  }

  return { inserted, updated, errors };
}

export async function persistItems(pool, rows, billerId) {
  if (!Array.isArray(rows) || rows.length === 0) return { inserted: 0, updated: 0, errors: 0 };

  let inserted = 0;
  let updated = 0;
  let errors = 0;

  for (const row of rows) {
    const code = row.code || row.codigo;
    if (!code) continue;

    const unitVal = parseTotal(row.unit_price || row.precio_unitario || row.valor_unitario || row.unitario || row.precio || row.total);
    const ivaPct = parseFloat(row.iva_percentage || row.iva) || 19;
    const retPct = parseFloat(row.retention_percentage || row.retencion) || 0;

    try {
      const { rows: [existing] } = await pool.query(
        `SELECT id FROM items WHERE biller_id = $1 AND code = $2`,
        [billerId, code]
      );

      if (existing) {
        await pool.query(
          `UPDATE items
             SET description=$1, unit_value=$2, iva_percentage=$3,
                 retention_percentage=$4, type=$5, updated_at=NOW()
           WHERE id = $6`,
          [
            row.description || row.descripcion || null,
            unitVal,
            ivaPct,
            retPct,
            row.type || row.tipo || 'producto',
            existing.id,
          ]
        );
        updated++;
      } else {
        await pool.query(
          `INSERT INTO items
             (biller_id, code, description, type, unit_value, iva_percentage, retention_percentage)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [billerId, code, row.description || row.descripcion || row.name || null, row.type || row.tipo || 'producto', unitVal, ivaPct, retPct]
        );
        inserted++;
      }
    } catch (err) {
      console.error(`[persist] Error upserting item code=${code}: ${err.message}`);
      errors++;
    }
  }

  return { inserted, updated, errors };
}

export async function persistConfig(pool, config, billerId) {
  if (!config || config.error) return { updated: false };

  try {
    const { rowCount } = await pool.query(
      `UPDATE billers
         SET name=COALESCE($1, name),
             email=COALESCE($2, email),
             phone=COALESCE($3, phone),
             address=COALESCE($4, address),
             city=COALESCE($5, city),
             document_number=COALESCE($6, document_number),
             updated_at=NOW()
       WHERE id = $7`,
      [
        config.name || config.comercial_name || null,
        config.email || null,
        config.phone || null,
        config.address || null,
        config.city || null,
        config.document_number || null,
        billerId,
      ]
    );
    return { updated: rowCount > 0 };
  } catch (err) {
    console.error(`[persist] Error updating biller config: ${err.message}`);
    return { updated: false, error: err.message };
  }
}

export async function persistAll(pool, syncResult, billerId) {
  const results = {};

  console.log('\n========== PERSISTING TO DATABASE ==========');

  // 1. Invoices
  console.log('[persist] Invoices...');
  try {
    results.invoices = await persistInvoices(pool, syncResult.invoices, billerId);
    console.log(`  → ${results.invoices.inserted} inserted, ${results.invoices.updated} updated, ${results.invoices.errors} errors`);
  } catch (err) {
    console.error(`  ✗ FAILED: ${err.message}`);
    results.invoices = { error: err.message };
  }

  // 2. Clients
  console.log('[persist] Clients...');
  try {
    results.clients = await persistClients(pool, syncResult.clients, billerId);
    console.log(`  → ${results.clients.inserted} inserted, ${results.clients.updated} updated, ${results.clients.errors} errors`);
  } catch (err) {
    console.error(`  ✗ FAILED: ${err.message}`);
    results.clients = { error: err.message };
  }

  // 3. Items
  console.log('[persist] Items...');
  try {
    results.items = await persistItems(pool, syncResult.items, billerId);
    console.log(`  → ${results.items.inserted} inserted, ${results.items.updated} updated, ${results.items.errors} errors`);
  } catch (err) {
    console.error(`  ✗ FAILED: ${err.message}`);
    results.items = { error: err.message };
  }

  // 4. Biller config
  console.log('[persist] Biller config...');
  try {
    results.config = await persistConfig(pool, syncResult.config, billerId);
    console.log(`  → ${results.config.updated ? 'updated' : 'no changes'}`);
  } catch (err) {
    console.error(`  ✗ FAILED: ${err.message}`);
    results.config = { error: err.message };
  }

  console.log('[persist] Done');
  return results;
}
