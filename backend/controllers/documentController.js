const pdfService = require('../services/pdfService');

let documents = [];

exports.upload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se envió ningún archivo' });

    const doc = {
      id: req.file.filename.replace(/\.[^/.]+$/, ''),
      originalName: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size,
      mimetype: req.file.mimetype,
      type: detectDocumentType(req.file.originalname),
      uploadedAt: new Date().toISOString(),
      extractedData: null
    };

    if (req.file.mimetype === 'application/pdf') {
      try {
        const text = await pdfService.extractText(req.file.path);
        doc.extractedData = pdfService.parseDocumentData(text, doc.type);
      } catch (pdfErr) {
        console.error('Error extracting PDF:', pdfErr.message);
      }
    }

    documents.push(doc);
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.list = (req, res) => {
  res.json(documents);
};

exports.getById = (req, res) => {
  const doc = documents.find(d => d.id === req.params.id);
  if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });
  res.json(doc);
};

exports.remove = (req, res) => {
  const idx = documents.findIndex(d => d.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Documento no encontrado' });
  documents.splice(idx, 1);
  res.json({ message: 'Documento eliminado' });
};

function detectDocumentType(filename) {
  const name = filename.toLowerCase();
  if (name.includes('factura') || name.includes('invoice')) return 'invoice';
  if (name.includes('nota') && (name.includes('credito') || name.includes('crédito'))) return 'credit_note';
  if (name.includes('nota') && (name.includes('debito') || name.includes('débito'))) return 'debit_note';
  if (name.includes('extracto') || name.includes('estado') || name.includes('bank')) return 'statement';
  if (name.includes('recibo') || name.includes('receipt')) return 'receipt';
  return 'other';
}
