-- Migration: Simplify database - remove relational tables, consolidate invoices
-- All data comes from xml_content going forward

-- 1. Drop tables that depend on invoices first (invoice_items)
DROP TABLE IF EXISTS invoice_items CASCADE;

-- 2. Drop items table (product catalog no longer stored separately)
DROP TABLE IF EXISTS items CASCADE;

-- 3. Drop clients table (client info comes from XML)
DROP TABLE IF EXISTS clients CASCADE;

-- 4. Drop indexes on invoices that reference dropped columns
DROP INDEX IF EXISTS idx_invoices_unique_ncf;
DROP INDEX IF EXISTS idx_clients_biller;
DROP INDEX IF EXISTS idx_clients_biller_name;
DROP INDEX IF EXISTS idx_clients_unique_document;
DROP INDEX IF EXISTS idx_items_biller;
DROP INDEX IF EXISTS idx_items_code;
DROP INDEX IF EXISTS idx_items_unique_code;
DROP INDEX IF EXISTS idx_invoice_items_invoice;

-- 5. Simplify invoices table - keep only essential columns
ALTER TABLE invoices DROP COLUMN IF EXISTS client CASCADE;
ALTER TABLE invoices DROP COLUMN IF EXISTS client_name CASCADE;
ALTER TABLE invoices DROP COLUMN IF EXISTS client_id CASCADE;
ALTER TABLE invoices DROP COLUMN IF EXISTS doc_type CASCADE;
ALTER TABLE invoices DROP COLUMN IF EXISTS total CASCADE;
ALTER TABLE invoices DROP COLUMN IF EXISTS paid CASCADE;
ALTER TABLE invoices DROP COLUMN IF EXISTS scraped_at CASCADE;
ALTER TABLE invoices DROP COLUMN IF EXISTS scraper_status CASCADE;
ALTER TABLE invoices DROP COLUMN IF EXISTS document_path CASCADE;
ALTER TABLE invoices DROP COLUMN IF EXISTS payload CASCADE;
ALTER TABLE invoices DROP COLUMN IF EXISTS raw_data CASCADE;
ALTER TABLE invoices DROP COLUMN IF EXISTS updated_at CASCADE;

-- 6. Recreate unique index on ncf for UPSERT
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_unique_ncf ON invoices (biller_id, ncf) WHERE ncf IS NOT NULL;
