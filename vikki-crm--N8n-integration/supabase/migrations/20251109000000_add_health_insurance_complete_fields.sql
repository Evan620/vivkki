-- Add comprehensive fields to health_insurance table to match the form requirements
-- This migration adds all fields needed for complete health insurance provider information

-- Add request method
ALTER TABLE health_insurance
ADD COLUMN IF NOT EXISTS request_method text DEFAULT 'Email';

-- Add address fields
ALTER TABLE health_insurance
ADD COLUMN IF NOT EXISTS street_address text DEFAULT '',
ADD COLUMN IF NOT EXISTS street_address_2 text DEFAULT '',
ADD COLUMN IF NOT EXISTS zip_code text DEFAULT '';

-- Add phone fields
ALTER TABLE health_insurance
ADD COLUMN IF NOT EXISTS phone_1_type text DEFAULT '',
ADD COLUMN IF NOT EXISTS phone_1 text DEFAULT '',
ADD COLUMN IF NOT EXISTS phone_2_type text DEFAULT '',
ADD COLUMN IF NOT EXISTS phone_2 text DEFAULT '';

-- Add fax fields
ALTER TABLE health_insurance
ADD COLUMN IF NOT EXISTS fax_1_type text DEFAULT '',
ADD COLUMN IF NOT EXISTS fax_1 text DEFAULT '',
ADD COLUMN IF NOT EXISTS fax_2_type text DEFAULT '',
ADD COLUMN IF NOT EXISTS fax_2 text DEFAULT '';

-- Add email fields
ALTER TABLE health_insurance
ADD COLUMN IF NOT EXISTS email_1_type text DEFAULT '',
ADD COLUMN IF NOT EXISTS email_1 text DEFAULT '',
ADD COLUMN IF NOT EXISTS email_2_type text DEFAULT '',
ADD COLUMN IF NOT EXISTS email_2 text DEFAULT '';

-- Add notes field
ALTER TABLE health_insurance
ADD COLUMN IF NOT EXISTS notes text DEFAULT '';

-- Update existing phone field to phone_1 if it exists and phone_1 is empty
UPDATE health_insurance
SET phone_1 = phone
WHERE phone_1 = '' AND phone IS NOT NULL AND phone != '';

