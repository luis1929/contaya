// One-time script: backfill client_name and total from xml_content
// Run: node backend/backfill-metadata.js
const { parseString } = require('xml2js');
const pool = require('./db/pool');

function textVal(obj) { if (typeof obj === 'string') return obj; if (obj && typeof obj === 'object') return obj._ ?? ''; return ''; }
function numVal(obj) { return parseFloat(textVal(obj)) || 0; }

async function main() {
  const { rows } = await pool.query(
    `SELECT id, xml_content FROM invoices WHERE xml_content IS NOT NULL AND xml_content != ''`
  );
  console.log(`Processing ${rows.length} invoices...`);

  let updated = 0;
  for (const row of rows) {
    try {
      const result = await new Promise((resolve, reject) => {
        parseString(row.xml_content, { explicitArray: false, mergeAttrs: true }, (err, r) => {
          if (err) reject(err); else resolve(r);
        });
      });

      let doc = result?.Invoice || result?.CreditNote || result?.DebitNote;

      // Handle AttachedDocument wrapping
      if (!doc && result?.AttachedDocument) {
        const innerXml = result.AttachedDocument?.['cac:Attachment']?.['cac:ExternalReference']?.['cbc:Description']
          || result.AttachedDocument?.['cac:Attachment']?.['cac:EmbeddedDocument']?.['cbc:Description']
          || result.AttachedDocument?.['cbc:Description'];
        if (innerXml && typeof innerXml === 'string') {
          const inner = await new Promise((resolve, reject) => {
            parseString(innerXml, { explicitArray: false, mergeAttrs: true }, (err, r) => {
              if (err) reject(err); else resolve(r);
            });
          });
          doc = inner?.Invoice || inner?.CreditNote || inner?.DebitNote;
        }
      }

      if (!doc) continue;

      const party = doc['cac:AccountingCustomerParty']?.['cac:Party'];
      const clientName = textVal(party?.['cac:PartyName']?.['cbc:Name'])
        || textVal(party?.['cac:PartyLegalEntity']?.['cbc:RegistrationName']);
      const total = numVal(doc['cac:LegalMonetaryTotal']?.['cbc:PayableAmount']);

      if (clientName || total) {
        await pool.query(
          `UPDATE invoices SET client_name = $1, total = $2 WHERE id = $3`,
          [clientName || null, total || null, row.id]
        );
        updated++;
      }
    } catch (err) {
      console.error(`Error processing ${row.id}: ${err.message}`);
    }
  }

  console.log(`Updated ${updated} invoices`);
  await pool.end();
}

main().catch(err => { console.error(err); process.exit(1); });
