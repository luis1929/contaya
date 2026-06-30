const { validate } = require('uuid');

/**
 * Validates Colombian invoice structure and business rules
 * @param {Object} invoice - Parsed invoice object
 */
function validateColombianInvoice(invoice) {
    // Basic structure validation
    if (!invoice['cbc:ID'] || !invoice['cbc:IssueDate']) {
        throw new Error('Missing required invoice fields');
    }

    // Colombian-specific validations
    const validIvaRates = [0, 5, 16];
    invoice.InvoiceLine.forEach(line => {
        const taxRate = parseFloat(line.TaxTotal?.TaxSubtotal?.['cbc:Percent']);
        if (taxRate && !validIvaRates.includes(taxRate)) {
            throw new Error(`Invalid IVA rate: ${taxRate}%`);
        }
    });

    // NIT validation (simplified)
    const sellerNit = invoice['cac:AccountingSupplierParty']['cac:Party']['cac:PartyIdentification']['cbc:ID'];
    if (!/^\d{9,10}$/.test(sellerNit)) {
        throw new Error('Invalid NIT format');
    }
}

module.exports = { validateColombianInvoice };
