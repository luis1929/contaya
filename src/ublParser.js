const { parseString } = require('xml2js');
const { validateColombianInvoice } = require('./validators');

/**
 * Parses UBL 2.1 XML and extracts invoice data
 * @param {string} xmlContent - Raw XML string
 * @returns {Promise<Object>} Structured invoice data
 */
async function parseColombianInvoice(xmlContent) {
    try {
        const result = await parseString(xmlContent, {
            explicitArray: false,
            mergeAttrs: true,
            explicitCharkey: true,
        });

        const invoice = result.Invoice;

        // Validate basic structure
        validateColombianInvoice(invoice);

        return {
            invoiceNumber: invoice['cbc:ID'],
            issueDate: invoice['cbc:IssueDate'],
            dueDate: invoice['cbc:DueDate'],
            totalAmount: parseFloat(invoice['cbc:TaxExclusiveAmount']),
            currency: invoice['cbc:CurrencyID'],
            seller: {
                nit: invoice['cac:AccountingSupplierParty']['cac:Party']['cac:PartyIdentification']['cbc:ID'],
                name: invoice['cac:AccountingSupplierParty']['cac:Party']['cac:PartyName']['cbc:Name']
            },
            buyer: {
                nit: invoice['cac:AccountingCustomerParty']['cac:Party']['cac:PartyIdentification']['cbc:ID'],
                name: invoice['cac:AccountingCustomerParty']['cac:Party']['cac:PartyName']['cbc:Name']
            },
            lines: invoice.InvoiceLine.map(line => ({
                description: line['cbc:Description'],
                quantity: parseFloat(line['cbc:InvoicedQuantity']),
                unitPrice: parseFloat(line.Price['cbc:PriceAmount']),
                taxRate: parseFloat(line.TaxTotal?.TaxSubtotal?.['cbc:Percent']),
                taxAmount: parseFloat(line.TaxTotal?.TaxSubtotal?.['cbc:TaxAmount']),
                lineTotal: parseFloat(line['cbc:LineExtensionAmount'])
            }))
        };
    } catch (error) {
        console.error('Invoice parsing error:', error);
        throw new Error('Invalid UBL 2.1 invoice format');
    }
}

module.exports = { parseColombianInvoice };
