import { parseString } from 'xml2js';

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

export async function parseInvoiceLines(xmlContent) {
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
