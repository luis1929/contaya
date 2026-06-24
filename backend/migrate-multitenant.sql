-- ============================================================
-- MIGRACIÓN MULTITENANCY
-- El servidor ya tiene:
--   - billers.id como UUID
--   - invoices.biller_id (FK a billers.id) con datos
--   - billers con passwords
-- Solo falta:
--   1. biller_id en clients
--   2. biller_id en documents
--   3. Índices
-- ============================================================

-- 1. ADD biller_id a clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS biller_id uuid REFERENCES billers(id);
CREATE INDEX IF NOT EXISTS idx_clients_biller ON clients(biller_id);
CREATE INDEX IF NOT EXISTS idx_clients_biller_name ON clients(biller_id, name);

-- 2. ADD biller_id a documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS biller_id uuid REFERENCES billers(id);
CREATE INDEX IF NOT EXISTS idx_documents_biller ON documents(biller_id);

-- 3. Poblar clients.biller_id según las facturas existentes
UPDATE clients c SET biller_id = i.biller_id
FROM invoices i
WHERE c.id = i.client_id AND c.biller_id IS NULL;

-- Clients sin facturas: asignar al biller por defecto (Vladimir)
UPDATE clients SET biller_id = '86bdb982-cf8e-43f9-a24e-d550fbada4af'
WHERE biller_id IS NULL;
