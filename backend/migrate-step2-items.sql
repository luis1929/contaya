-- ============================================================
-- MIGRACIÓN PASO 2: Tabla de ítems (productos/servicios)
-- ============================================================

CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  biller_id UUID NOT NULL REFERENCES billers(id) ON DELETE CASCADE,
  code VARCHAR(100) NOT NULL,
  unspsc_code VARCHAR(20),
  description TEXT NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'producto',
  unit_value NUMERIC(15,2) NOT NULL DEFAULT 0,
  iva_percentage NUMERIC(5,2) DEFAULT 19.00,
  retention_percentage NUMERIC(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_items_biller ON items(biller_id);
CREATE INDEX IF NOT EXISTS idx_items_code ON items(biller_id, code);
