const HEADER_ALIASES = {
  numeracion: 'ncf',
  numeración: 'ncf',
  numero: 'ncf',
  número: 'ncf',
  ncf: 'ncf',
  cliente: 'client',
  'cliente cufe': 'client',
  'razón social': 'client',
  nombre: 'name',
  'fecha emision': 'date',
  'fecha de emision': 'date',
  fecha: 'date',
  emision: 'date',
  creacion: 'date',
  creación: 'date',
  total: 'total',
  valor: 'total',
  subtotal: 'subtotal',
  estado: 'status',
  estatus: 'status',
  pagado: 'paid',
  pago: 'paid',
  codigo: 'code',
  código: 'code',
  'codigo producto': 'code',
  identificador: 'code',
  referencia: 'code',
  descripcion: 'description',
  descripción: 'description',
  tipo: 'type',
  iva: 'iva_percentage',
  'iva %': 'iva_percentage',
  '% iva': 'iva_percentage',
  retencion: 'retention_percentage',
  retención: 'retention_percentage',
  '% ret': 'retention_percentage',
  'retencion %': 'retention_percentage',
  'retención %': 'retention_percentage',
  nit: 'document_number',
  nits: 'document_number',
  documento: 'document_number',
  identificacion: 'document_number',
  identificación: 'document_number',
  rnc: 'document_number',
  'no. documento': 'document_number',
  'no documento': 'document_number',
  direccion: 'address',
  dirección: 'address',
  telefono: 'phone',
  teléfono: 'phone',
  correo: 'email',
  email: 'email',
  'e-mail': 'email',
  ciudad: 'city',
  municipio: 'city',
  cantidad: 'quantity',
  cant: 'quantity',
  'vr. unitario': 'unit_price',
  'vr unitario': 'unit_price',
  'valor unitario': 'unit_price',
  'precio unitario': 'unit_price',
  unitario: 'unit_price',
  precio: 'unit_price',
  accion: 'action',
  acción: 'action',
  seleccion: 'action',
  selección: 'action',
  opciones: 'action',
  eventos: 'events',
  'eventos t.v.': 'events',
  activo: 'is_active',
  'nit/cc': 'document_number',
  unidad: 'unit',
  moneda: 'currency',
};

export function normalizeHeader(text) {
  const cleaned = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9%]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return HEADER_ALIASES[cleaned] || cleaned.replace(/\s+/g, '_');
}

export function buildBrowserParser() {
  return `
    var HEADER_ALIASES = ${JSON.stringify(HEADER_ALIASES)};

    function normalizeHeader(text) {
      var cleaned = text.toLowerCase()
        .normalize('NFD').replace(/[\\u0300-\\u036f]/g, '')
        .replace(/[^a-z0-9%]/g, ' ')
        .replace(/\\s+/g, ' ')
        .trim();
      return HEADER_ALIASES[cleaned] || cleaned.replace(/\\s+/g, '_');
    }

    function isHeaderRow(row) {
      var cells = row.querySelectorAll('th, td');
      var headerKeywords = ['numeracion','numero','ncf','nit','cliente','cufe','fecha','creacion','total',
        'subtotal','codigo','descripcion','tipo','iva','retencion','nombre','documento','direccion',
        'telefono','correo','email','ciudad','municipio','cantidad','valor','pago','pagado','estado',
        'estatus','eventos','accion','opciones','identificacion','identificador','precio','unitario',
        'unidad','moneda','seleccion'];
      var matchCount = 0;
      for (var c = 0; c < cells.length; c++) {
        var txt = cells[c].textContent.trim().toLowerCase();
        if (!txt) continue;
        for (var k = 0; k < headerKeywords.length; k++) {
          if (txt.indexOf(headerKeywords[k]) !== -1) { matchCount++; break; }
        }
      }
      return matchCount >= 2;
    }

    function extractTableHeaders(table) {
      var theadRow = table.querySelector('thead tr');
      if (theadRow) {
        var headers = [];
        theadRow.querySelectorAll('th, td').forEach(function(cell) {
          headers.push(normalizeHeader(cell.textContent.trim()));
        });
        if (headers.length > 0) return { headers: headers, skipRows: 0 };
      }

      var allRows = table.querySelectorAll('tbody tr, thead tr');
      if (allRows.length === 0) allRows = table.querySelectorAll('tr');

      for (var r = 0; r < Math.min(3, allRows.length); r++) {
        var cells = allRows[r].querySelectorAll('th, td');
        var textCells = [];
        cells.forEach(function(c) { textCells.push(c.textContent.trim()); });
        if (isHeaderRow(allRows[r])) {
          return { headers: textCells.map(normalizeHeader), skipRows: 1 };
        }
      }

      return { headers: [], skipRows: 0 };
    }

    function extractTableRows(table, headers, skipCount) {
      var allRows = table.querySelectorAll('tbody tr');
      if (allRows.length === 0) allRows = table.querySelectorAll('tr');

      var rows = [];
      for (var r = skipCount; r < allRows.length; r++) {
        var cells = allRows[r].querySelectorAll('td');
        if (cells.length === 0) continue;
        var entry = {};
        var isEmpty = true;
        for (var i = 0; i < cells.length; i++) {
          var val = cells[i].textContent.trim();
          if (headers[i]) {
            entry[headers[i]] = val;
          } else if (i < headers.length) {
            entry[headers[i]] = val;
          } else {
            entry['col_' + i] = val;
          }
          if (val) isEmpty = false;
        }
        if (!isEmpty) rows.push(entry);
      }
      return rows;
    }

    function parseDataTable(table) {
      var result = extractTableHeaders(table);
      var headers = result.headers;
      var rows = extractTableRows(table, headers, result.skipRows);
      return { headers: headers, rows: rows };
    }
  `;
}

export function hasNextPageScript() {
  return `
    (function() {
      var links = document.querySelectorAll('a');
      for (var i = 0; i < links.length; i++) {
        if (links[i].textContent.trim() === 'Siguiente') {
          var parent = links[i].closest('li') || links[i].parentElement;
          return !parent.classList.contains('disabled');
        }
      }
      return false;
    })()
  `;
}
