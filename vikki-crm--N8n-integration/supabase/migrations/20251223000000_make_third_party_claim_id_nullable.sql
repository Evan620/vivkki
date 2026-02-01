/*
  # Make third_party_claim_id Nullable in auto_adjusters Table
  
  ## Overview
  Makes the third_party_claim_id column nullable since auto adjusters can now be created
  independently (linked to insurance companies via auto_insurance_id) without being
  tied to a specific third party claim.
  
  ## Changes
  - ALTER COLUMN third_party_claim_id to allow NULL values
*/

-- Make third_party_claim_id nullable since adjusters can exist independently
ALTER TABLE auto_adjusters
  ALTER COLUMN third_party_claim_id DROP NOT NULL;

-- Add comment to document the change
COMMENT ON COLUMN auto_adjusters.third_party_claim_id IS 'Reference to the third party claim this adjuster handles (nullable - adjusters can exist independently linked to insurance companies)';

