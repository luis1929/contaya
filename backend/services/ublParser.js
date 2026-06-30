const { parseString } = require('xml2js');
const path = require('path');
const { validateColombianInvoice } = require(path.join(__dirname, '..', 'validators'));

function toArray(val) {
    return Array.isArray(val) ? val : val ? [val] : [];
}

async function parseColombianInvoice(xmlContent) {
    try {
        const result = await parseString(xmlContent, {
            explicitArray: false,
            mergeAttrs: true,
            explicitCharkey: true,
        });

        const invoice = result.Invoice;
        validateColombianInvoice(invoice);

        const monetaryTotal = invoice['cac:LegalMonetaryTotal'] || {};
        const lines = toArray(invoice.InvoiceLine).map(line => ({
            description: line['cbc:Description'] || '',
            quantity: parseFloat(line['cbc:InvoicedQuantity']) || 0,
            unitPrice: parseFloat(line?.Price?.['cbc:PriceAmount']) || 0,
            taxRate: parseFloat(line?.TaxTotal?.TaxSubtotal?.['cbc:Percent']) || 0,
            taxAmount: parseFloat(line?.TaxTotal?.TaxSubtotal?.['cbc:TaxAmount']) || 0,
            lineTotal: parseFloat(line['cbc:LineExtensionAmount']) || 0
        }));

        return {
            invoiceNumber: invoice['cbc:ID'] || '',
            issueDate: invoice['cbc:IssueDate'] || '',
            dueDate: invoice['cbc:DueDate'] || null,
            totalAmount: parseFloat(monetaryTotal['cbc:TaxInclusiveAmount'] || invoice['cbc:TaxExclusiveAmount']) || 0,
            currency: invoice['cbc:DocumentCurrencyCode'] || invoice['cbc:CurrencyID'] || 'COP',
            seller: {
                nit: invoice['cac:AccountingSupplierParty']?.['cac:Party']?.['cac:PartyIdentification']?.['cbc:ID'] || '',
                name: invoice['cac:AccountingSupplierParty']?.['cac:Party']?.['cac:PartyName']?.['cbc:Name'] || ''
            },
            buyer: {
                nit: invoice['cac:AccountingCustomerParty']?.['cac:Party']?.['cac:PartyIdentification']?.['cbc:ID'] || '',
                name: invoice['cac:AccountingCustomerParty']?.['cac:Party']?.['cac:PartyName']?.['cbc:Name'] || ''
            },
            lines
        };
    } catch (error) {
        console.error('Invoice parsing error:', error);
        throw new Error('Invalid UBL 2.1 invoice format');
    }
}

module.exports = { parseColombianInvoice };
