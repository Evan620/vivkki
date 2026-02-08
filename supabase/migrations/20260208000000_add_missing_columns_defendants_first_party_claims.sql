-- Add missing columns to defendants table
ALTER TABLE defendants ADD COLUMN IF NOT EXISTS claim_number text DEFAULT '';
ALTER TABLE defendants ADD COLUMN IF NOT EXISTS email text DEFAULT '';
ALTER TABLE defendants ADD COLUMN IF NOT EXISTS phone_number text DEFAULT '';

-- Add missing columns to first_party_claims table
ALTER TABLE first_party_claims ADD COLUMN IF NOT EXISTS pip_available numeric DEFAULT 0;
ALTER TABLE first_party_claims ADD COLUMN IF NOT EXISTS pip_used numeric DEFAULT 0;
ALTER TABLE first_party_claims ADD COLUMN IF NOT EXISTS med_pay_available numeric DEFAULT 0;
ALTER TABLE first_party_claims ADD COLUMN IF NOT EXISTS med_pay_used numeric DEFAULT 0;
