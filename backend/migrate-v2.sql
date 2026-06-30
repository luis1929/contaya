-- Migration v2: add back client_name and total as lightweight metadata columns
-- These are populated by the scraper from HTML table data (no XML needed)
-- Remove if you want fully XML-only schema (after re-scraping all invoices)

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_name text;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total numeric(12,2);

CREATE INDEX IF NOT EXISTS idx_invoices_client_name ON invoices (client_name);
