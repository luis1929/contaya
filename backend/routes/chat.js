const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');
const { billerContext, whereBiller } = require('../middleware/tenantContext');
const { success } = require('../lib/response');
const asyncHandler = require('../lib/asyncHandler');

router.use(authMiddleware, billerContext);

function parseQuery(text) {
  const t = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  if (/cuantos?\s*(clientes|clients?)\b/.test(t) || /total\s*de\s*clientes/.test(t) || /numero\s*de\s*clientes/.test(t)) {
    return { type: 'client_count' };
  }
  if (/cuantos?\s*(facturas?|facturas?|invoice)\b/.test(t) || /total\s*de\s*facturas/.test(t) || /numero\s*de\s*facturas/.test(t)) {
    return { type: 'invoice_count' };
  }
  if (/resumen\s*(mensual|mensual|del\s*mes)/.test(t) || /este\s*mes/.test(t) || (/ingresos?\b/.test(t) && /mes\b/.test(t))) {
    return { type: 'monthly_summary' };
  }
  if (/ingresos?\b/.test(t) || /total\s*(facturado|vendido|ingresos?)/.test(t) || /monto\s*total/.test(t)) {
    return { type: 'revenue' };
  }
  if (/productos?\s*(mas|top|populares?|vendidos?)/.test(t) || /top\s*(productos?|items?)/.test(t) || /articulos?\s*mas\s*vendidos?/.test(t)) {
    return { type: 'top_products' };
  }
  if (/clientes?\s*(mas|top|frecuentes?|principales?)/.test(t) || /top\s*clientes/.test(t) || /mejores\s*clientes/.test(t)) {
    return { type: 'top_clients' };
  }
  if (/declaracion(es)?/.test(t) || /d(?:e|e)clareishon/.test(t)) {
    return { type: 'declarations' };
  }
  if (/facturas?\s*(pendientes?|vencidas?|sin\s*pagar)/.test(t) || /status\s*pending/.test(t)) {
    return { type: 'pending_invoices' };
  }
  if (/ultimas?\s*(facturas?|documentos?)/.test(t) || /recientes?/.test(t) || /ultimos?\s*(5|10|15)\s*(facturas?|documentos?)/.test(t)) {
    const match = t.match(/ultimos?\s*(\d+)\s*(facturas|documentos)/);
    return { type: 'recent_invoices', limit: match ? parseInt(match[1]) : 5 };
  }
  if (/resumen\s*(general|completo|ejecutivo)/.test(t) || /dashboard/.test(t) || /panel/.test(t)) {
    return { type: 'full_summary' };
  }

  return { type: 'unknown' };
}

async function executeQuery(req, parsed) {
  const params = [];

  switch (parsed.type) {
    case 'client_count': {
      let sql = 'SELECT COUNT(*) AS total FROM clients WHERE 1=1';
      sql += whereBiller(req, params);
      const { rows } = await pool.query(sql, params);
      return { text: `Tienes **${rows[0].total}** cliente(s) registrados.`, data: rows[0] };
    }

    case 'invoice_count': {
      let sql = 'SELECT COUNT(*) AS total FROM invoices WHERE 1=1';
      sql += whereBiller(req, params);
      const { rows } = await pool.query(sql, params);
      return { text: `Hay **${rows[0].total}** factura(s) en el sistema.`, data: rows[0] };
    }

    case 'revenue': {
      let sql = `SELECT COUNT(*) AS total_count,
        COALESCE(SUM(COALESCE(total,0)),0) AS total_amount
        FROM invoices WHERE 1=1`;
      sql += whereBiller(req, params);
      const { rows } = await pool.query(sql, params);
      const amount = parseFloat(rows[0].total_amount).toLocaleString('es-DO', { minimumFractionDigits: 2 });
      return { text: `El monto total facturado es de **RD$${amount}** en **${rows[0].total_count}** factura(s).`, data: rows[0] };
    }

    case 'monthly_summary': {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      params.push(year, month);
      let sql = `SELECT COUNT(*) AS total, COALESCE(SUM(COALESCE(total,0)),0) AS amount
        FROM invoices
        WHERE EXTRACT(YEAR FROM created_at) = $1 AND EXTRACT(MONTH FROM created_at) = $2`;
      sql += whereBiller(req, params);
      const { rows } = await pool.query(sql, params);
      const amount = parseFloat(rows[0].amount).toLocaleString('es-DO', { minimumFractionDigits: 2 });
      const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
      return {
        text: `Resumen de **${meses[month-1]} ${year}**: **${rows[0].total}** factura(s) por un total de **RD$${amount}**.`,
        data: rows[0]
      };
    }

    case 'top_products': {
      let sql = `SELECT i.xml_content FROM invoices i WHERE i.xml_content IS NOT NULL AND i.xml_content != ''`;
      sql += whereBiller(req, params, 'i');
      const { rows } = await pool.query(sql, params);
      const groups = {};
      for (const row of rows) {
        try {
          const descMatches = row.xml_content.matchAll(/<cbc:Description[^>]*>([^<]+)<\/cbc:Description>/g);
          const qtyMatches = row.xml_content.matchAll(/<cbc:InvoicedQuantity[^>]*>([^<]+)<\/cbc:InvoicedQuantity>/g);
          const descs = [...descMatches].map(m => m[1].trim());
          const qtys = [...qtyMatches].map(m => parseFloat(m[1]) || 1);
          descs.forEach((desc, i) => {
            if (!desc) return;
            if (!groups[desc]) groups[desc] = { name: desc, qty: 0, count: 0 };
            groups[desc].qty += qtys[i] || 1;
            groups[desc].count++;
          });
        } catch {}
      }
      const top = Object.values(groups).sort((a, b) => b.qty - a.qty).slice(0, 5);
      if (!top.length) return { text: 'No hay productos registrados en las facturas.', data: [] };
      const lines = top.map((p, i) => `${i+1}. **${p.name}** — ${p.qty} unidad(es)`).join('\n');
      return { text: `**Top productos más vendidos:**\n${lines}`, data: top };
    }

    case 'top_clients': {
      let sql = `SELECT i.xml_content FROM invoices i WHERE i.xml_content IS NOT NULL AND i.xml_content != ''`;
      sql += whereBiller(req, params, 'i');
      const { rows } = await pool.query(sql, params);
      const groups = {};
      for (const row of rows) {
        try {
          const m = row.xml_content.match(/<cac:AccountingCustomerParty[\s\S]{0,3000}?<\/cac:AccountingCustomerParty>/);
          if (!m) continue;
          const nameMatch = m[0].match(/<cbc:(Name|RegistrationName)[^>]*>([^<]+)<\/cbc:\1>/);
          const name = nameMatch ? nameMatch[2].trim() : 'Sin nombre';
          if (name.length < 3) continue;
          if (!groups[name]) groups[name] = { name, count: 0 };
          groups[name].count++;
        } catch {}
      }
      const top = Object.values(groups).sort((a, b) => b.count - a.count).slice(0, 5);
      if (!top.length) return { text: 'No hay clientes registrados en facturas.', data: [] };
      const lines = top.map((c, i) => `${i+1}. **${c.name}** — ${c.count} factura(s)`).join('\n');
      return { text: `**Clientes principales:**\n${lines}`, data: top };
    }

    case 'declarations': {
      let sql = 'SELECT COUNT(*) AS total FROM declarations WHERE 1=1';
      sql += whereBiller(req, params);
      const { rows } = await pool.query(sql, params);
      return { text: `Tienes **${rows[0].total}** declaracion(es) registradas.`, data: rows[0] };
    }

    case 'pending_invoices': {
      params.push('pending');
      let sql = `SELECT COUNT(*) AS total, COALESCE(SUM(COALESCE(total,0)),0) AS amount
        FROM invoices WHERE status = $1`;
      sql += whereBiller(req, params);
      const { rows } = await pool.query(sql, params);
      const amount = parseFloat(rows[0].amount).toLocaleString('es-DO', { minimumFractionDigits: 2 });
      return { text: `Tienes **${rows[0].total}** factura(s) pendiente(s) por un total de **RD$${amount}**.`, data: rows[0] };
    }

    case 'recent_invoices': {
      const limit = parsed.limit || 5;
      params.push(limit);
      let sql = `SELECT id, ncf, client_name, total, status, created_at
        FROM invoices WHERE 1=1`;
      sql += whereBiller(req, params);
      sql += ' ORDER BY created_at DESC LIMIT $' + params.length;
      const { rows } = await pool.query(sql, params);
      if (!rows.length) return { text: 'No hay facturas recientes.', data: [] };
      const lines = rows.map((r, i) =>
        `${i+1}. **${r.ncf || 'S/N'}** — ${r.client_name || 'Sin cliente'} — RD$${parseFloat(r.total||0).toLocaleString('es-DO', {minimumFractionDigits:2})}`
      ).join('\n');
      return { text: `**Últimas ${limit} factura(s):**\n${lines}`, data: rows };
    }

    case 'full_summary': {
      const paramsC = [], paramsI = [];
      let sqlC = 'SELECT COUNT(*) FROM clients WHERE 1=1' + whereBiller(req, paramsC);
      let sqlI = 'SELECT COUNT(*), COALESCE(SUM(COALESCE(total,0)),0) FROM invoices WHERE 1=1' + whereBiller(req, paramsI);
      const [c, i] = await Promise.all([
        pool.query(sqlC, paramsC),
        pool.query(sqlI, paramsI)
      ]);
      const clientCount = parseInt(c.rows[0].count);
      const invoiceCount = parseInt(i.rows[0].count);
      const totalAmount = parseFloat(i.rows[0].coalesce || 0);
      const amount = totalAmount.toLocaleString('es-DO', { minimumFractionDigits: 2 });
      return {
        text: `**Resumen ejecutivo:**\n- 👥 **${clientCount}** cliente(s)\n- 📄 **${invoiceCount}** factura(s)\n- 💰 Total facturado: **RD$${amount}**`,
        data: { clients: clientCount, invoices: invoiceCount, total: totalAmount }
      };
    }

    default: {
      const suggestions = [
        '• "Cuantos clientes tengo?"',
        '• "Cuantas facturas tengo?"',
        '• "Resumen de ingresos"',
        '• "Resumen del mes"',
        '• "Top productos mas vendidos"',
        '• "Mejores clientes"',
        '• "Ultimas 5 facturas"',
        '• "Resumen ejecutivo"',
      ];
      return {
        text: `No entendí tu consulta. Intenta con:\n${suggestions.join('\n')}`,
        data: null,
        type: 'help'
      };
    }
  }
}

router.post('/query', asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message es requerido' });
  }

  const parsed = parseQuery(message);
  const result = await executeQuery(req, parsed);

  success(res, {
    reply: result.text,
    data: result.data,
    type: parsed.type,
  });
}));

module.exports = router;
