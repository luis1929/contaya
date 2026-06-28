-- ==========================================================================
-- MIGRACIÓN: Sincronización Facturatech → Contaya
-- Crea constraints UNIQUE para UPSERT, tablas faltantes y columnas ausentes.
-- ==========================================================================
-- Ejecutar: psql -d contaya -f migrate-sync.sql
-- ==========================================================================

BEGIN;

-- ==========================================================================
-- 1. Columnas faltantes en billers
-- ==========================================================================
ALTER TABLE billers ADD COLUMN IF NOT EXISTS scrape_error TEXT;
ALTER TABLE billers ADD COLUMN IF NOT EXISTS comercial_name VARCHAR(255);

-- ==========================================================================
-- 2. Columnas faltantes en invoices
-- ==========================================================================
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS scraper_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS document_path TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS xml_content TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS has_xml BOOLEAN DEFAULT false;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS has_pdf BOOLEAN DEFAULT false;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- ==========================================================================
-- 3. Columnas faltantes en clients
-- ==========================================================================
ALTER TABLE clients ADD COLUMN IF NOT EXISTS document_type VARCHAR(10) DEFAULT 'NIT';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS verification_digit VARCHAR(3);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS regimen VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS rut_metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ciudad VARCHAR(100);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- ==========================================================================
-- 4. Tabla items (productos/servicios) — si no existe
-- ==========================================================================
CREATE TABLE IF NOT EXISTS items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  biller_id UUID NOT NULL REFERENCES billers(id) ON DELETE CASCADE,
  code VARCHAR(100) NOT NULL,
  unspsc_code VARCHAR(20),
  description TEXT,
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

-- ==========================================================================
-- 5. Constraints UNIQUE para UPSERT
-- ==========================================================================

-- invoices: un NCF por biller (natural key)
-- Elimina duplicados previos si existen (se queda con el más reciente)
DELETE FROM invoices a USING invoices b
  WHERE a.biller_id = b.biller_id AND a.ncf = b.ncf
    AND COALESCE(a.updated_at, a.created_at, a.scraped_at)
      < COALESCE(b.updated_at, b.created_at, b.scraped_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_unique_ncf
  ON invoices(biller_id, ncf)
  WHERE ncf IS NOT NULL;

-- clients: un documento por biller
DROP INDEX IF EXISTS clients_name_idx;

DELETE FROM clients a USING clients b
  WHERE a.biller_id = b.biller_id AND a.document = b.document
    AND a.created_at < b.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_clients_unique_document
  ON clients(biller_id, document)
  WHERE document IS NOT NULL;

-- items: un código por biller
DELETE FROM items a USING items b
  WHERE a.biller_id = b.biller_id AND a.code = b.code
    AND a.updated_at < b.updated_at;

CREATE UNIQUE INDEX IF NOT EXISTS idx_items_unique_code
  ON items(biller_id, code)
  WHERE code IS NOT NULL;

COMMIT;
