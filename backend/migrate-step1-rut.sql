-- ============================================================
-- MIGRACIÓN PASO 1: Campos RUT para clientes
-- ============================================================

ALTER TABLE clients ADD COLUMN IF NOT EXISTS document_type VARCHAR(10) DEFAULT 'NIT';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS verification_digit VARCHAR(3);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS regimen VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS rut_metadata JSONB DEFAULT '{}';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS ciudad VARCHAR(100);
