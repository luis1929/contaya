function toArray(val) {
    return Array.isArray(val) ? val : val ? [val] : [];
}

function validateColombianInvoice(invoice) {
    if (!invoice['cbc:ID'] || !invoice['cbc:IssueDate']) {
        throw new Error('Missing required invoice fields');
    }

    const validIvaRates = [0, 5, 16];
    const lines = toArray(invoice.InvoiceLine);
    for (const line of lines) {
        const taxRate = parseFloat(line?.TaxTotal?.TaxSubtotal?.['cbc:Percent']);
        if (taxRate && !validIvaRates.includes(taxRate)) {
            throw new Error(`Invalid IVA rate: ${taxRate}%`);
        }
    }

    const sellerNit = invoice['cac:AccountingSupplierParty']?.['cac:Party']?.['cac:PartyIdentification']?.['cbc:ID'];
    if (!sellerNit || !/^\d{9,10}$/.test(sellerNit)) {
        throw new Error('Invalid NIT format');
    }
}

module.exports = { validateColombianInvoice };
