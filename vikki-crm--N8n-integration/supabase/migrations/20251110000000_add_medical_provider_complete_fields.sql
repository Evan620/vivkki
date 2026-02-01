-- Add comprehensive fields to medical_providers table
-- Based on the HTML form structure with phone_3, fax_3, etc.

ALTER TABLE medical_providers
ADD COLUMN IF NOT EXISTS street_address TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS street_address_2 TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS state TEXT DEFAULT 'OK',
ADD COLUMN IF NOT EXISTS zip_code TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS phone_1_type TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS phone_1 TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS phone_2_type TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS phone_2 TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS phone_3_type TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS phone_3 TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS fax_1_type TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS fax_1 TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS fax_2_type TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS fax_2 TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS fax_3_type TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS fax_3 TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS email_1_type TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS email_1 TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS email_2_type TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS email_2 TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';

-- Rename request_method to hipaa_method for consistency with form
-- Or add hipaa_method as an alias (we'll use request_method as the main field)
-- Update existing records to use hipaa_method if needed
-- For now, we'll keep request_method and add hipaa_method as a computed column or just use request_method

-- Add authenticated user policies for UPDATE, INSERT, DELETE
-- Drop existing policies if they exist, then create new ones
DROP POLICY IF EXISTS "Authenticated users can update medical providers" ON medical_providers;
CREATE POLICY "Authenticated users can update medical providers"
  ON medical_providers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can insert medical providers" ON medical_providers;
CREATE POLICY "Authenticated users can insert medical providers"
  ON medical_providers FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete medical providers" ON medical_providers;
CREATE POLICY "Authenticated users can delete medical providers"
  ON medical_providers FOR DELETE
  TO authenticated
  USING (true);

