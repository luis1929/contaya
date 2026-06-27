-- ============================================================
-- MIGRACIÓN RBAC + ADMIN + GESTIÓN DOCUMENTAL AVANZADA
-- ============================================================

-- 1. Tabla de roles
CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO roles (name, description) VALUES
  ('superadmin', 'Acceso total al sistema'),
  ('admin', 'Administración de facturadores y configuración'),
  ('biller', 'Usuario facturador con datos propios'),
  ('viewer', 'Solo lectura del facturador asignado')
ON CONFLICT (name) DO NOTHING;

-- 2. Permisos por rol
CREATE TABLE IF NOT EXISTS role_permissions (
  id SERIAL PRIMARY KEY,
  role_name VARCHAR(50) REFERENCES roles(name),
  resource VARCHAR(100) NOT NULL,
  action VARCHAR(50) NOT NULL, -- create, read, update, delete, manage
  UNIQUE(role_name, resource, action)
);

-- Permisos superadmin
INSERT INTO role_permissions (role_name, resource, action) VALUES
  ('superadmin', '*', 'manage')
ON CONFLICT DO NOTHING;

-- Permisos admin
INSERT INTO role_permissions (role_name, resource, action) VALUES
  ('admin', 'billers', 'create'),
  ('admin', 'billers', 'read'),
  ('admin', 'billers', 'update'),
  ('admin', 'billers', 'delete'),
  ('admin', 'invoices', 'read'),
  ('admin', 'invoices', 'manage'),
  ('admin', 'documents', 'read'),
  ('admin', 'documents', 'delete'),
  ('admin', 'clients', 'read'),
  ('admin', 'system', 'read'),
  ('admin', 'audit_log', 'read')
ON CONFLICT DO NOTHING;

-- Permisos biller
INSERT INTO role_permissions (role_name, resource, action) VALUES
  ('biller', 'invoices', 'read'),
  ('biller', 'invoices', 'create'),
  ('biller', 'documents', 'create'),
  ('biller', 'documents', 'read'),
  ('biller', 'documents', 'delete'),
  ('biller', 'clients', 'read')
ON CONFLICT DO NOTHING;

-- 3. Extender users con role
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'admin';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- 4. Tabla de auditoría
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  actor_name VARCHAR(255),
  actor_role VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100),
  resource_id VARCHAR(255),
  details JSONB DEFAULT '{}',
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at DESC);

-- 5. Tags para documentos
CREATE TABLE IF NOT EXISTS document_tags (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#2563eb',
  biller_id UUID REFERENCES billers(id) ON DELETE CASCADE,
  UNIQUE(name, biller_id)
);

-- 6. Documentos: relación muchos-a-muchos con tags
CREATE TABLE IF NOT EXISTS document_tag_map (
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  tag_id INTEGER REFERENCES document_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (document_id, tag_id)
);

-- 7. Extensiones para documents
ALTER TABLE documents ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'other';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- 8. Tabla de notas en documentos
CREATE TABLE IF NOT EXISTS document_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Sistema de notificaciones
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  biller_id UUID REFERENCES billers(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50) DEFAULT 'info', -- info, warning, success, error
  is_read BOOLEAN DEFAULT false,
  link VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_biller ON notifications(biller_id, is_read);

-- 10. Estados de documento (workflow)
ALTER TABLE documents ADD COLUMN IF NOT EXISTS workflow_status VARCHAR(50) DEFAULT 'pending';
-- pending, reviewed, approved, rejected, archived

-- 11. Configuración del sistema
CREATE TABLE IF NOT EXISTS system_settings (
  key VARCHAR(255) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO system_settings (key, value) VALUES
  ('app_name', 'Contaya'),
  ('items_per_page', '20'),
  ('session_timeout', '720'),
  ('theme', 'light')
ON CONFLICT (key) DO NOTHING;
