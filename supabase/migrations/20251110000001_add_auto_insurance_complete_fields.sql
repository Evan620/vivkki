-- Add comprehensive fields to auto_insurance table
-- Based on the HTML form structure with phone_2, fax_2, etc.

ALTER TABLE auto_insurance
ADD COLUMN IF NOT EXISTS request_method TEXT DEFAULT 'Email',
ADD COLUMN IF NOT EXISTS street_address TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS street_address_2 TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS zip_code TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS phone_1_type TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS phone_1 TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS phone_2_type TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS phone_2 TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS fax_1_type TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS fax_1 TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS fax_2_type TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS fax_2 TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS email_1_type TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS email_1 TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS email_2_type TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS email_2 TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- Update existing phone field to phone_1 if it exists and phone_1 is empty
UPDATE auto_insurance
SET phone_1 = phone
WHERE phone_1 = '' AND phone IS NOT NULL AND phone != '';

-- Add authenticated user policies for UPDATE, INSERT, DELETE
-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Authenticated users can update auto insurance" ON auto_insurance;
CREATE POLICY "Authenticated users can update auto insurance"
  ON auto_insurance FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can insert auto insurance" ON auto_insurance;
CREATE POLICY "Authenticated users can insert auto insurance"
  ON auto_insurance FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete auto insurance" ON auto_insurance;
CREATE POLICY "Authenticated users can delete auto insurance"
  ON auto_insurance FOR DELETE
  TO authenticated
  USING (true);

