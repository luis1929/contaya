const express = require('express');
const router = express.Router();
const { billerContext, whereBiller } = require('../middleware/tenantContext');
const { error } = require('../lib/response');
const db = require('../db/pool');

// Apply tenant context middleware to all chat routes
router.use(billerContext);

// Tool definitions for the LLM
const tools = [
  {
    type: 'function',
    function: {
      name: 'get_invoice',
      description: 'Obtiene los detalles completos de una factura específica por su ID',
      parameters: {
        type: 'object',
        properties: {
          invoice_id: {
            type: 'string',
            description: 'UUID de la factura a consultar'
          }
        },
        required: ['invoice_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_recent_invoices',
      description: 'Lista las facturas más recientes del biller actual',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'integer',
            description: 'Número máximo de facturas a devolver (por defecto 10)',
            default: 10
          }
        },
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_client_summary',
      description: 'Obtiene un resumen de un cliente específico incluyendo sus facturas',
      parameters: {
        type: 'object',
        properties: {
          client_id: {
            type: 'string',
            description: 'UUID del cliente a consultar'
          }
        },
        required: ['client_id']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_monthly_summary',
      description: 'Obtiene un resumen del mes actual: total facturas, monto total, facturas pendientes, etc.',
      parameters: {
        type: 'object',
        properties: {},
        required: []
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'list_top_products',
      description: 'Lista los productos/servicios más vendidos por cantidad o ingreso',
      parameters: {
        type: 'object',
        properties: {
          limit: {
            type: 'integer',
            description: 'Número de productos a devolver (por defecto 5)',
            default: 5
          },
          by: {
            type: 'string',
            enum: ['quantity', 'revenue'],
            description: 'Ordenar por cantidad vendida o por ingreso generado',
            default: 'revenue'
          }
        },
        required: []
      }
    }
  }
];

// System prompt for the LLM
const systemPrompt = `Eres un asistente contable para facturación electrónica en Colombia. 
Respondes en español y usas las herramientas disponibles para consultar datos de facturas, clientes y productos.
NUNCA inventes datos. Si no tienes información, di que no la tienes.
El usuario es un biller (emisor de facturas) y solo puede ver sus propios datos.`;

// Map internal tool result types to frontend-expected types
const TYPE_MAP = {
  invoice_card: 'invoice_card',
  invoice_list: 'invoice_list',
  client_summary: 'client_summary',
  monthly_summary: 'text',
  top_products: 'text',
  text: 'text'
};

// Tool implementations
async function executeTool(toolName, args, billerId, isAdmin) {
  const client = await pool.connect();
  try {
    const params = [];
    const billerClause = billerId ? whereBiller({ billerId }, params) : '';

    switch (toolName) {
      case 'get_invoice': {
        const { invoice_id } = args;
        const query = `
          SELECT 
            i.id, i.invoice_number, i.issue_date, i.due_date, i.status,
            i.total_amount, i.tax_amount, i.currency, i.notes,
            c.id as client_id, c.name as client_name, c.email as client_email,
            c.identification_number as client_nit, c.address as client_address,
            json_agg(
              json_build_object(
                'id', ii.id,
                'description', ii.description,
                'quantity', ii.quantity,
                'unit_price', ii.unit_price,
                'total', ii.total,
                'product_id', ii.product_id,
                'product_name', p.name
              )
            ) as items
          FROM invoices i
          LEFT JOIN clients c ON i.client_id = c.id
          LEFT JOIN invoice_items ii ON i.id = ii.invoice_id
          LEFT JOIN products p ON ii.product_id = p.id
          WHERE i.id = $1 ${billerClause}
          GROUP BY i.id, c.id
        `;
        params.unshift(invoice_id);
        const result = await client.query(query, params);
        if (result.rows.length === 0) {
          return { error: 'Factura no encontrada' };
        }
        return { type: 'invoice_card', data: result.rows[0] };
      }

      case 'list_recent_invoices': {
        const { limit = 10 } = args;
        const query = `
          SELECT 
            i.id, i.invoice_number, i.issue_date, i.due_date, i.status,
            i.total_amount, i.currency,
            c.name as client_name
          FROM invoices i
          LEFT JOIN clients c ON i.client_id = c.id
          WHERE 1=1 ${billerClause}
          ORDER BY i.issue_date DESC, i.created_at DESC
          LIMIT $${params.length + 1}
        `;
        params.push(limit);
        const result = await client.query(query, params);
        return { type: 'invoice_list', data: result.rows };
      }

      case 'get_client_summary': {
        const { client_id } = args;
        const query = `
          SELECT 
            c.id, c.name, c.email, c.phone, c.address,
            c.identification_type, c.identification_number,
            COUNT(i.id) as total_invoices,
            COALESCE(SUM(i.total_amount) FILTER (WHERE i.status = 'paid'), 0) as total_paid,
            COALESCE(SUM(i.total_amount) FILTER (WHERE i.status = 'pending'), 0) as total_pending,
            COALESCE(SUM(i.total_amount) FILTER (WHERE i.status = 'overdue'), 0) as total_overdue,
            MAX(i.issue_date) as last_invoice_date
          FROM clients c
          LEFT JOIN invoices i ON c.id = i.client_id ${billerClause ? `AND i.biller_id = ${billerClause.split('=')[1]}` : ''}
          WHERE c.id = $1 ${billerClause.replace('biller_id', 'c.biller_id')}
          GROUP BY c.id
        `;
        params.unshift(client_id);
        const result = await client.query(query, params);
        if (result.rows.length === 0) {
          return { error: 'Cliente no encontrado' };
        }
        return { type: 'client_summary', data: result.rows[0] };
      }

      case 'get_monthly_summary': {
        const query = `
          SELECT 
            COUNT(*) as total_invoices,
            COALESCE(SUM(total_amount), 0) as total_amount,
            COUNT(*) FILTER (WHERE status = 'paid') as paid_count,
            COALESCE(SUM(total_amount) FILTER (WHERE status = 'paid'), 0) as paid_amount,
            COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
            COALESCE(SUM(total_amount) FILTER (WHERE status = 'pending'), 0) as pending_amount,
            COUNT(*) FILTER (WHERE status = 'overdue') as overdue_count,
            COALESCE(SUM(total_amount) FILTER (WHERE status = 'overdue'), 0) as overdue_amount
          FROM invoices
          WHERE 1=1 ${billerClause}
            AND issue_date >= date_trunc('month', CURRENT_DATE)
            AND issue_date < date_trunc('month', CURRENT_DATE) + interval '1 month'
        `;
        const result = await client.query(query, params);
        return { type: 'monthly_summary', data: result.rows[0] };
      }

      case 'list_top_products': {
        const { limit = 5, by = 'revenue' } = args;
        const orderBy = by === 'quantity' ? 'total_quantity DESC' : 'total_revenue DESC';
        const query = `
          SELECT 
            p.id, p.name, p.description, p.unit_price,
            SUM(ii.quantity) as total_quantity,
            SUM(ii.total) as total_revenue,
            COUNT(DISTINCT ii.invoice_id) as invoice_count
          FROM products p
          JOIN invoice_items ii ON p.id = ii.product_id
          JOIN invoices i ON ii.invoice_id = i.id
          WHERE 1=1 ${billerClause}
            AND i.issue_date >= CURRENT_DATE - interval '12 months'
          GROUP BY p.id
          ORDER BY ${orderBy}
          LIMIT $${params.length + 1}
        `;
        params.push(limit);
        const result = await client.query(query, params);
        return { type: 'top_products', data: result.rows };
      }

      default:
        return { error: `Herramienta desconocida: ${toolName}` };
    }
  } finally {
    client.release();
  }
}

// Call NVIDIA NIM API with function calling
async function callLLM(messages) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new Error('NVIDIA_API_KEY no configurada');
  }

  const model = process.env.NVIDIA_MODEL || 'openai/deepseek-ai/deepseek-v4-flash';

  const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages,
      tools,
      tool_choice: 'auto',
      temperature: 0.1,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Error NVIDIA API: ${response.status} - ${err}`);
  }

  return response.json();
}

// Generate human-readable message from tool result
function generateMessage(toolName, result) {
  if (result.error) return result.error;

  switch (toolName) {
    case 'get_invoice':
      return `Factura ${result.data.invoice_number} encontrada: ${result.data.client_name} - $${Number(result.data.total_amount).toLocaleString('es-CO')} (${result.data.status})`;
    case 'list_recent_invoices':
      return result.data.length > 0
        ? `Se encontraron ${result.data.length} facturas recientes.`
        : 'No hay facturas registradas aún.';
    case 'get_client_summary':
      return `Resumen de ${result.data.name}: ${result.data.total_invoices} facturas, $${Number(result.data.total_paid).toLocaleString('es-CO')} pagados, $${Number(result.data.total_pending).toLocaleString('es-CO')} pendientes.`;
    case 'get_monthly_summary':
      return `Resumen del mes: ${result.data.total_invoices} facturas por $${Number(result.data.total_amount).toLocaleString('es-CO')} (${result.data.paid_count} pagadas, ${result.data.pending_count} pendientes, ${result.data.overdue_count} vencidas).`;
    case 'list_top_products':
      return result.data.length > 0
        ? `Top ${result.data.length} productos más vendidos.`
        : 'No hay datos de productos vendidos en el último año.';
    default:
      return 'Consulta completada.';
  }
}

// Main chat endpoint
router.post('/query', async (req, res) => {
  try {
    const { message } = req.body;
    const billerId = req.billerId;
    const isAdmin = req.isAdmin;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Mensaje requerido' });
    }

    // Admins must specify a biller context (multi-tenant isolation)
    if (isAdmin && !billerId) {
      return res.json({
        type: 'text',
        data: null,
        message: 'Como administrador, debes seleccionar un biller para consultar sus datos.'
      });
    }

    // Prepare messages for LLM
    const messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: message }
    ];

    // Call LLM with function calling
    const llmResponse = await callLLM(messages);
    const choice = llmResponse.choices?.[0];
    const toolCalls = choice?.message?.tool_calls;

    if (!toolCalls || toolCalls.length === 0) {
      // No tool called - LLM couldn't map to a function
      return res.json({
        type: 'text',
        data: null,
        message: 'No entendí tu consulta, ¿puedes reformularla?'
      });
    }

    // Execute all tool calls sequentially (for now, just first one)
    // TODO: Handle multiple tool calls in sequence
    const toolCall = toolCalls[0];
    const toolName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);

    // Execute tool with tenant filtering
    const result = await executeTool(toolName, args, billerId, isAdmin);

    // Format response with frontend-expected types
    const responseData = {
      type: TYPE_MAP[result.type] || 'text',
      data: result.data || null,
      message: generateMessage(toolName, result)
    };

    // If tool returned error, adjust type
    if (result.error) {
      responseData.type = 'text';
      responseData.message = result.error;
    }

    res.json(responseData);

  } catch (err) {
    console.error('[Chat Error]', err);
    error(res, err, 500);
  }
});

module.exports = router;
