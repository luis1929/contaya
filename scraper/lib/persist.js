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

async function upsertInvoices(pool, invoices, billerId) {
  if (!invoices?.length) return { inserted: 0 };

  let inserted = 0;
  for (const inv of invoices) {
    if (!inv.ncf) continue;

    let xmlContent = null;
    if (inv._xml_path && fs.existsSync(inv._xml_path)) {
      xmlContent = fs.readFileSync(inv._xml_path, 'utf8');
    }

    try {
      await pool.query(
        `INSERT INTO invoices (biller_id, ncf, status, xml_content, has_xml, has_pdf)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (biller_id, ncf) WHERE ncf IS NOT NULL
         DO UPDATE SET status=EXCLUDED.status,
           xml_content=EXCLUDED.xml_content, has_xml=EXCLUDED.has_xml,
           has_pdf=EXCLUDED.has_pdf, updated_at=NOW()`,
        [billerId, inv.ncf, inv.status || 'pending',
         xmlContent, xmlContent ? true : false, false]
      );
      inserted++;
    } catch (err) {
      console.error(`  [comprobantes] Error con NCF ${inv.ncf}: ${err.message}`);
    }
  }
  return { inserted };
}

export async function persistAll(pool, syncResult, billerId) {
  console.log('[persist] Comprobantes...');
  const result = await upsertInvoices(pool, syncResult.invoices, billerId);
  console.log(`  → ${result.inserted} facturas guardadas con XML`);
  return { invoices: result };
}
