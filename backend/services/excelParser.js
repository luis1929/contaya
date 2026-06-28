const XLSX = require('xlsx');

const columnMap = {
  'código interno': 'code',
  'codigo interno': 'code',
  'cod_interno': 'code',
  'código': 'code',
  'codigo': 'code',
  'código dian': 'unspsc_code',
  'codigo dian': 'unspsc_code',
  'unspsc': 'unspsc_code',
  'código unspsc': 'unspsc_code',
  'codigo unspsc': 'unspsc_code',
  'descripción': 'description',
  'descripcion': 'description',
  'descrip': 'description',
  'tipo': 'type',
  'producto/servicio': 'type',
  'valor unitario': 'unit_value',
  'valor': 'unit_value',
  'precio': 'unit_value',
  'iva': 'iva_percentage',
  '%iva': 'iva_percentage',
  'iva %': 'iva_percentage',
  'retención': 'retention_percentage',
  'retencion': 'retention_percentage',
  '% retención': 'retention_percentage',
  'retención %': 'retention_percentage',
};

function normalizeHeader(h) {
  return String(h).toLowerCase().trim().replace(/\s+/g, ' ');
}

function parseExcel(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return { rows: [], errors: ['El archivo no contiene hojas'] };

  const sheet = workbook.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  if (!raw.length) return { rows: [], errors: ['El archivo está vacío'] };

  const headers = Object.keys(raw[0]);
  const mapped = {};
  for (const h of headers) {
    const key = columnMap[normalizeHeader(h)];
    if (key) mapped[key] = h;
  }

  const missing = ['code', 'description'].filter(k => !mapped[k]);
  if (missing.length) {
    return { rows: [], errors: [`Columnas requeridas no encontradas: ${missing.join(', ')}. Mapeo disponible: código interno, descripción, tipo, valor unitario, IVA, retención, código DIAN/UNSPSC`] };
  }

  const rows = [];
  const errors = [];

  for (let i = 0; i < raw.length; i++) {
    const row = raw[i];
    const entry = {
      code: String(row[mapped.code] || '').trim(),
      unspsc_code: mapped.unspsc_code ? String(row[mapped.unspsc_code] || '').trim() : '',
      description: String(row[mapped.description] || '').trim(),
      type: mapped.type ? String(row[mapped.type] || '').trim().toLowerCase() : 'producto',
      unit_value: parseFloat(String(row[mapped.unit_value] || '0').replace(/[$,]/g, '')) || 0,
      iva_percentage: mapped.iva_percentage ? parseFloat(String(row[mapped.iva_percentage] || '0').replace('%', '')) || 0 : 19,
      retention_percentage: mapped.retention_percentage ? parseFloat(String(row[mapped.retention_percentage] || '0').replace('%', '')) || 0 : 0,
    };

    const rowErrors = [];
    if (!entry.code) rowErrors.push('Fila ' + (i + 1) + ': código interno requerido');
    if (!entry.description) rowErrors.push('Fila ' + (i + 1) + ': descripción requerida');

    if (entry.type && !['producto', 'servicio'].includes(entry.type)) {
      entry.type = 'producto';
    }

    if (rowErrors.length) {
      errors.push(...rowErrors);
    } else {
      rows.push(entry);
    }
  }

  return { rows, errors, total: raw.length, valid: rows.length };
}

module.exports = { parseExcel };
