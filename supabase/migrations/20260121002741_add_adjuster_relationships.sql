/*
  # Add Adjuster Relationships to Claims and Bills
  
  ## Overview
  Adds foreign key columns to link adjusters to health claims and medical bills.
  
  ## Changes
  - Add `health_adjuster_id` to `health_claims` table
  - Add `medical_provider_adjuster_id` to `medical_bills` table
  - Add indexes for performance
*/

-- Add health_adjuster_id to health_claims table
ALTER TABLE health_claims 
  ADD COLUMN IF NOT EXISTS health_adjuster_id bigint REFERENCES health_adjusters(id) ON DELETE SET NULL;

-- Add medical_provider_adjuster_id to medical_bills table
ALTER TABLE medical_bills 
  ADD COLUMN IF NOT EXISTS medical_provider_adjuster_id bigint REFERENCES medical_provider_adjusters(id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_health_claims_adjuster ON health_claims(health_adjuster_id);
CREATE INDEX IF NOT EXISTS idx_medical_bills_adjuster ON medical_bills(medical_provider_adjuster_id);

-- Add comments
COMMENT ON COLUMN health_claims.health_adjuster_id IS 'Reference to the health insurance adjuster handling this claim';
COMMENT ON COLUMN medical_bills.medical_provider_adjuster_id IS 'Reference to the medical provider adjuster handling this bill';
