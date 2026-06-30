-- Backfill client_name and total from xml_content for existing rows
-- Run after adding columns via migrate-v2.sql

UPDATE invoices SET
  client_name = SUBSTRING(xml_content FROM '<cac:AccountingCustomerParty[\s\S]{0,3000}?<\/cac:AccountingCustomerParty>') # '~'
FROM (
  SELECT id,
    (SELECT regexp_matches(xml_content,
      '<cac:AccountingCustomerParty[\s\S]{0,3000}?<\/cac:AccountingCustomerParty>', 'g'))[1] AS party
  FROM invoices WHERE xml_content IS NOT NULL AND xml_content != ''
) AS sub
WHERE invoices.id = sub.id;

-- Update client_name using XML regex on the AccountingCustomerParty block
WITH client_data AS (
  SELECT id,
    COALESCE(
      NULLIF(regexp_replace(
        (regexp_matches(xml_content,
          '<cac:AccountingCustomerParty[\s\S]{0,3000}?<\/cac:AccountingCustomerParty>', 'g'))[1],
        '.*<cbc:(Name|RegistrationName)[^>]*>([^<]+)<\/cbc:\1>.*', '\2'), ''),
      ''
    ) AS name
  FROM invoices
  WHERE xml_content IS NOT NULL AND xml_content != ''
)
UPDATE invoices i
SET client_name = c.name
FROM client_data c
WHERE i.id = c.id AND c.name != '';

-- Update total from XML
WITH total_data AS (
  SELECT id,
    NULLIF(regexp_replace(
      (regexp_matches(xml_content,
        '<cbc:PayableAmount[^>]*>([^<]+)<\/cbc:PayableAmount>', 'g'))[1],
      '[^0-9.\-]', '', 'g'), ''
    )::numeric(12,2) AS total
  FROM invoices
  WHERE xml_content IS NOT NULL AND xml_content != ''
)
UPDATE invoices i
SET total = t.total
FROM total_data t
WHERE i.id = t.id;
