CREATE TABLE IF NOT EXISTS declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  biller_id UUID REFERENCES billers(id),
  type VARCHAR(20) NOT NULL,
  year INT NOT NULL,
  month INT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  submitted_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_declarations_biller ON declarations(biller_id);
CREATE INDEX IF NOT EXISTS idx_declarations_period ON declarations(year, month);
CREATE INDEX IF NOT EXISTS idx_declarations_status ON declarations(status);

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE clients ADD COLUMN IF NOT EXISTS rnc VARCHAR(20);
