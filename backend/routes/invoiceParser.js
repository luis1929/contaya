const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { parseColombianInvoice } = require('../services/ublParser');
const { extractUblFromPdf } = require('../services/pdfExtractor');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/parse', upload.single('invoice'), async (req, res) => {
    try {
        const xmlContent = await extractUblFromPdf(req.file.path);
        const invoiceData = await parseColombianInvoice(xmlContent);

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
