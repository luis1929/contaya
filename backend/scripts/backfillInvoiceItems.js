const { Pool } = require('pg');
const { parseString } = require('xml2js');

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

function toArray(val) {
  return Array.isArray(val) ? val : val ? [val] : [];
}

function textVal(obj) {
  if (typeof obj === 'string') return obj;
  if (obj && typeof obj === 'object') return obj._ ?? '';
  return '';
}

function numVal(obj) {
  return parseFloat(textVal(obj)) || 0;
}

function parseXml(xmlContent) {
  return new Promise((resolve, reject) => {
    parseString(xmlContent, { explicitArray: false, mergeAttrs: true }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

function extractLines(invoice) {
  if (!invoice?.['cac:InvoiceLine']) return [];
  return toArray(invoice['cac:InvoiceLine']).map(line => {
    const item = line['cac:Item'] || {};
    const note = line['cbc:Note'];
    const description = textVal(
      (Array.isArray(note) ? note[0] : note)
      || item['cbc:Description']
      || line['cbc:Description']
    );
    const code = textVal(
      item['cac:SellersItemIdentification']?.['cbc:ID']
      || item['cac:StandardItemIdentification']?.['cbc:ID']
    );
    const taxSubtotal = line?.['cac:TaxTotal']?.['cac:TaxSubtotal'];
    const taxCategory = taxSubtotal?.['cac:TaxCategory'];

    return {
      code,
      description,
      quantity: numVal(line['cbc:InvoicedQuantity']),
      unitPrice: numVal(line?.['cac:Price']?.['cbc:PriceAmount']),
      ivaPercent: numVal(taxCategory?.['cbc:Percent'] || taxSubtotal?.['cbc:Percent']),
      taxAmount: numVal(taxSubtotal?.['cbc:TaxAmount'] || line?.['cac:TaxTotal']?.['cbc:TaxAmount']),
      total: numVal(line['cbc:LineExtensionAmount']),
    };
  });
}

async function parseInvoiceLines(xmlContent) {
  const result = await parseXml(xmlContent);

  if (result?.Invoice?.['cac:InvoiceLine']) {
    return extractLines(result.Invoice);
  }

  if (result?.AttachedDocument) {
    const doc = result.AttachedDocument;
    const innerXml = doc?.['cac:Attachment']?.['cac:ExternalReference']?.['cbc:Description']
                  || doc?.['cac:Attachment']?.['cac:EmbeddedDocument']?.['cbc:Description']
                  || doc?.['cbc:Description'];
    if (innerXml && innerXml.includes('<Invoice')) {
      return parseInvoiceLines(innerXml);
    }
  }

  if (result?.Invoice) {
    return extractLines(result.Invoice);
  }

  return [];
}

async function backfill() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  console.log('Buscando facturas con XML sin procesar...');
  const { rows: invoices } = await pool.query(`
    SELECT i.id, i.ncf, i.xml_content, b.name AS biller
    FROM invoices i
    JOIN billers b ON b.id = i.biller_id
    WHERE i.xml_content IS NOT NULL
      AND i.xml_content != ''
      AND NOT EXISTS (
        SELECT 1 FROM invoice_items ii WHERE ii.invoice_id = i.id
      )
    ORDER BY i.biller_id, i.created_at
  `);

  console.log(`Encontradas ${invoices.length} facturas por procesar.\n`);

  let processed = 0, totalLines = 0, errors = 0;

  for (const inv of invoices) {
    try {
      const lines = await parseInvoiceLines(inv.xml_content);
      if (lines.length === 0) {
        console.log(`  [skip] ${inv.ncf} (${inv.biller}): 0 líneas extraídas`);
        continue;
      }

      await pool.query('DELETE FROM invoice_items WHERE invoice_id=$1', [inv.id]);

      for (const line of lines) {
        await pool.query(
          `INSERT INTO invoice_items (invoice_id, code, description, quantity, unit_price, iva_percentage, total)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [inv.id, line.code, line.description, line.quantity, line.unitPrice, line.ivaPercent, line.total]
        );
      }

      processed++;
      totalLines += lines.length;
      console.log(`  [ok] ${inv.ncf} (${inv.biller}): ${lines.length} líneas`);
    } catch (err) {
      errors++;
      console.error(`  [err] ${inv.ncf}: ${err.message}`);
    }
  }

  console.log(`\nResumen: ${processed} facturas procesadas, ${totalLines} líneas, ${errors} errores`);

  await pool.end();
}

backfill().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
