/*
  # Add Coverage Fields to First Party Claims
  
  ## Overview
  Adds detailed coverage tracking fields to first_party_claims table for PIP, MedPay, UM/UIM, and property damage.
  
  ## Changes
  - Add `pip_available` (numeric) - Total PIP coverage available
  - Add `pip_used` (numeric) - Amount of PIP coverage used
  - Add `med_pay_available` (numeric) - Total MedPay coverage available
  - Add `med_pay_used` (numeric) - Amount of MedPay coverage used
  - Add `um_uim_coverage` (text) - UM/UIM coverage details
  - Add `property_damage` (numeric) - Property damage amount
*/

-- Add PIP tracking fields
ALTER TABLE first_party_claims
  ADD COLUMN IF NOT EXISTS pip_available numeric(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pip_used numeric(12, 2) DEFAULT 0;

-- Add MedPay tracking fields
ALTER TABLE first_party_claims
  ADD COLUMN IF NOT EXISTS med_pay_available numeric(12, 2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS med_pay_used numeric(12, 2) DEFAULT 0;

-- Add UM/UIM and property damage fields
ALTER TABLE first_party_claims
  ADD COLUMN IF NOT EXISTS um_uim_coverage text,
  ADD COLUMN IF NOT EXISTS property_damage numeric(12, 2) DEFAULT 0;

-- Add comments for documentation
COMMENT ON COLUMN first_party_claims.pip_available IS 'Total PIP (Personal Injury Protection) coverage available';
COMMENT ON COLUMN first_party_claims.pip_used IS 'Amount of PIP coverage already used';
COMMENT ON COLUMN first_party_claims.med_pay_available IS 'Total MedPay coverage available';
COMMENT ON COLUMN first_party_claims.med_pay_used IS 'Amount of MedPay coverage already used';
COMMENT ON COLUMN first_party_claims.um_uim_coverage IS 'Uninsured/Underinsured Motorist coverage details';
COMMENT ON COLUMN first_party_claims.property_damage IS 'Property damage amount';
