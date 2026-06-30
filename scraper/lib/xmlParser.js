import { parseString } from 'xml2js';

function toArray(val) {
  return Array.isArray(val) ? val : val ? [val] : [];
}

export function parseInvoiceLines(xmlContent) {
  return new Promise((resolve, reject) => {
    parseString(xmlContent, { explicitArray: false, mergeAttrs: true }, (err, result) => {
      if (err) return reject(err);
      try {
        const invoice = result?.Invoice;
        if (!invoice) return resolve([]);

        const lines = toArray(invoice['cac:InvoiceLine']).map(line => ({
          code: line?.['cac:Item']?.['cac:SellersItemIdentification']?.['cbc:ID']
                || line?.['cac:Item']?.['cbc:ID'] || '',
          description: line?.['cbc:Description'] || line?.['cac:Item']?.['cbc:Description'] || '',
          quantity: parseFloat(line['cbc:InvoicedQuantity']) || 0,
          unitPrice: parseFloat(line?.['cac:Price']?.['cbc:PriceAmount']) || 0,
          ivaPercent: parseFloat(line?.['cac:TaxTotal']?.['cac:TaxSubtotal']?.['cbc:Percent']) || 0,
          taxAmount: parseFloat(line?.['cac:TaxTotal']?.['cac:TaxSubtotal']?.['cbc:TaxAmount']) || 0,
          total: parseFloat(line['cbc:LineExtensionAmount']) || 0,
        }));

        resolve(lines);
      } catch (e) {
        reject(e);
      }
    });
  });
}
