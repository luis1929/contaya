-- ============================================================
-- MIGRACIÓN PASO 4: Visor documental y almacenamiento XML
-- ============================================================

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS document_path TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS xml_content TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS has_xml BOOLEAN DEFAULT false;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS has_pdf BOOLEAN DEFAULT false;
