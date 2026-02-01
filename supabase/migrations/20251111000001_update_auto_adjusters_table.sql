/*
  # Update Auto Adjusters Table
  
  ## Overview
  Updates the auto_adjusters table to match the HTML form structure:
  - Change from third_party_claim_id to auto_insurance_id
  - Add middle_name field
  - Add fax field
  - Change mailing_address to street_address
*/

-- Add new columns if they don't exist
ALTER TABLE auto_adjusters
  ADD COLUMN IF NOT EXISTS auto_insurance_id bigint REFERENCES auto_insurance(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS middle_name text DEFAULT '',
  ADD COLUMN IF NOT EXISTS fax text DEFAULT '',
  ADD COLUMN IF NOT EXISTS street_address text DEFAULT '';

-- Migrate data: copy mailing_address to street_address if street_address is empty
UPDATE auto_adjusters
SET street_address = mailing_address
WHERE (street_address IS NULL OR street_address = '') AND mailing_address IS NOT NULL AND mailing_address != '';

-- Create index on auto_insurance_id
CREATE INDEX IF NOT EXISTS idx_auto_adjusters_insurance ON auto_adjusters(auto_insurance_id);

-- Add comments
COMMENT ON COLUMN auto_adjusters.auto_insurance_id IS 'Reference to the auto insurance company this adjuster works for';
COMMENT ON COLUMN auto_adjusters.middle_name IS 'Adjuster middle name';
COMMENT ON COLUMN auto_adjusters.fax IS 'Fax number for adjuster communications';
COMMENT ON COLUMN auto_adjusters.street_address IS 'Street address for adjuster (preferred over mailing_address)';

