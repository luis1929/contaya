const fs = require('fs');
const pdfParse = require('pdf-parse');

exports.extractText = async (filePath) => {
  const dataBuffer = fs.readFileSync(filePath);
  const data = await pdfParse(dataBuffer);
  return data.text;
};

exports.parseDocumentData = (text, docType) => {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const result = {
    type: docType,
    rawLines: lines,
    parsed: {}
  };

  const rncRegex = /(RNC|CEDULA|NCF)\s*[:\-]?\s*([0-9\-]+)/i;
  const totalRegex = /(total|monto|importe)\s*[:\-]?\s*\$?\s*([0-9,]+\.?\d*)/i;
  const dateRegex = /(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/;
  const ncfRegex = /(E\d{2}|B\d{2}|F\d{2})\s*[:\-]?\s*([0-9]{11})/;

  for (const line of lines) {
    if (!result.parsed.rnc) {
      const rncMatch = line.match(rncRegex);
      if (rncMatch) result.parsed.rnc = rncMatch[2];
    }
    if (!result.parsed.total) {
      const totalMatch = line.match(totalRegex);
      if (totalMatch) result.parsed.total = parseFloat(totalMatch[2].replace(/,/g, ''));
    }
    if (!result.parsed.date) {
      const dateMatch = line.match(dateRegex);
      if (dateMatch) result.parsed.date = dateMatch[1];
    }
    if (!result.parsed.ncf) {
      const ncfMatch = line.match(ncfRegex);
      if (ncfMatch) result.parsed.ncf = ncfMatch[2];
    }
  }

  return result;
};
