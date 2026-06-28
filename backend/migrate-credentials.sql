-- ============================================================
-- MIGRACIÓN: Credenciales cifradas para scraper FacturaTech
-- ============================================================

CREATE TABLE IF NOT EXISTS biller_credentials (
  biller_id UUID PRIMARY KEY REFERENCES billers(id) ON DELETE CASCADE,
  username_encrypted TEXT,
  password_encrypted TEXT,
  is_configured BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_biller_credentials_configured
  ON biller_credentials(is_configured);
