const express = require('express');
const multer = require('multer');
const { parseColombianInvoice } = require('../ublParser');
const { extractUblFromPdf } = require('../pdfExtractor');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/parse', upload.single('invoice'), async (req, res) => {
    try {
        const xmlContent = await extractUblFromPdf(req.file.path);
        const invoiceData = await parseColombianInvoice(xmlContent);

        // Clean up temporary file
        fs.unlinkSync(req.file.path);

        res.json({
            success: true,
            data: invoiceData
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

module.exports = router;
