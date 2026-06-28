const pdfParse = require('pdf-parse');

const patterns = [
  { key: 'document_number', label: 'NIT', regex: /NIT[:\s]*([\d.\-]+)/i },
  { key: 'document_number', label: 'NIT', regex: /N[uú]mero\s+de\s+Identificaci[oó]n[:\s]*[\d.\-]+/i },
  { key: 'verification_digit', label: 'DV', regex: /(?:D[Ii]gito\s+)?Verificaci[oó]n[:\s]*(\d{1,2})/i },
  { key: 'commercial_name', label: 'Razón Social', regex: /(?:Raz[oó]n\s+Social|Nombre\s+o\s+Raz[oó]n)[:\s]*(.+)/i },
  { key: 'commercial_name', label: 'Razón Social', regex: /Raz[oó]n\s*Social[:\s]*(.+)/i },
  { key: 'address', label: 'Dirección', regex: /Direcci[oó]n[:\s]*(.+)/i },
  { key: 'ciudad', label: 'Ciudad', regex: /(?:Ciudad|Municipio)[:\s]*(.+)/i },
  { key: 'regimen', label: 'Régimen', regex: /R[eé]gimen[:\s]*(.+)/i },
  { key: 'email', label: 'Correo', regex: /(?:Correo\s+Electr[oó]nico|E[-\s]?mail)[:\s]*([\w@.\-]+)/i },
  { key: 'document_type', label: 'Tipo Documento', regex: /(?:Tipo\s+de\s+Documento|Tipo\s+Documento)[:\s]*(NIT|CC|CE|NUIP|Pasaporte)/i },
];

async function parseRut(buffer) {
  const data = await pdfParse(buffer);
  const text = data.text;

  const result = { document_type: 'NIT' };
  const matched = new Set();

  for (const p of patterns) {
    if (matched.has(p.key)) continue;
    const m = text.match(p.regex);
    if (m && m[1]) {
      const val = m[1].trim();
      if (val && !matched.has(p.key)) {
        result[p.key] = val;
        matched.add(p.key);
      }
    }
  }

  result._rawText = text.substring(0, 500);
  result._confidence = matched.size;
  result._totalExpected = new Set(patterns.map(p => p.key)).size;

  return result;
}

module.exports = { parseRut };
