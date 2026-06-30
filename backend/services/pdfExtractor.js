const pdf = require('pdf-parse');
const fs = require('fs');

/**
 * Extracts UBL XML from Colombian electronic invoice PDF
 * @param {string} pdfPath - Path to PDF file
 * @returns {Promise<string>} Extracted XML content
 */
async function extractUblFromPdf(pdfPath) {
    try {
        const data = await pdf(fs.readFileSync(pdfPath));

        // Colombian invoices typically contain XML in the metadata
        const xmlMatch = data.text.match(/<Invoice[^>]*>(.*?)<\/Invoice>/s);
        if (!xmlMatch) {
            throw new Error('No UBL XML found in PDF');
        }

        return xmlMatch[0];
    } catch (error) {
        console.error('PDF extraction error:', error);
        throw new Error('Failed to extract invoice XML');
    }
}

module.exports = { extractUblFromPdf };
