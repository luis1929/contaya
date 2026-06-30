module.exports = {
    validIvaRates: [0, 5, 16],
    nitRegex: /^\d{9,10}$/,
    requiredFields: [
        'cbc:ID',
        'cbc:IssueDate',
        'cac:AccountingSupplierParty',
        'cac:AccountingCustomerParty'
    ],
    xmlNamespaces: {
        ubl: 'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
        cbc: 'urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2',
        cac: 'urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2'
    }
};
