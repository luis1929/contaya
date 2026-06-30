interface ColombianInvoice {
    invoiceNumber: string;
    issueDate: string;
    dueDate?: string;
    totalAmount: number;
    currency: string;
    seller: {
        nit: string;
        name: string;
    };
    buyer: {
        nit: string;
        name: string;
    };
    lines: Array<{
        description: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
        taxAmount: number;
        lineTotal: number;
    }>;
}

interface UblParser {
    parseColombianInvoice(xmlContent: string): Promise<ColombianInvoice>;
}
