-- ============================================================
-- MIGRACIÓN PASO 3: invoice_items + soporte para emisión
-- ============================================================

CREATE TABLE IF NOT EXISTS invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  item_id UUID REFERENCES items(id) ON DELETE SET NULL,
  code VARCHAR(100),
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  iva_percentage NUMERIC(5,2) DEFAULT 19.00,
  retention_percentage NUMERIC(5,2) DEFAULT 0,
  total NUMERIC(15,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice ON invoice_items(invoice_id);

-- Asegurar columna client_id en invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS scraper_status VARCHAR(20) DEFAULT 'pending';
