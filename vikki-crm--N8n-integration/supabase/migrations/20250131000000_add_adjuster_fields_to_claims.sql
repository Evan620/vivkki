/*
  # Add Adjuster Fields to Claims Tables
  
  ## Overview
  Adds detailed adjuster information fields to first_party_claims and third_party_claims tables.
  This allows storing first name, last name, email, and fax separately instead of just name and phone.
  
  ## Changes
  - Add `adjuster_first_name` (text, nullable) to first_party_claims
  - Add `adjuster_last_name` (text, nullable) to first_party_claims
  - Add `adjuster_email` (text, nullable) to first_party_claims
  - Add `adjuster_fax` (text, nullable) to first_party_claims
  - Add `adjuster_first_name` (text, nullable) to third_party_claims
  - Add `adjuster_last_name` (text, nullable) to third_party_claims
  - Add `adjuster_email` (text, nullable) to third_party_claims
  - Add `adjuster_fax` (text, nullable) to third_party_claims
  
  ## Migration Strategy
  - Keep existing `adjuster_name` and `adjuster_phone` fields for backward compatibility
  - New fields are nullable to allow gradual migration
  - Existing data in `adjuster_name` can be split into first/last name manually or via application logic
*/

-- Add adjuster fields to first_party_claims
ALTER TABLE first_party_claims
  ADD COLUMN IF NOT EXISTS adjuster_first_name text,
  ADD COLUMN IF NOT EXISTS adjuster_last_name text,
  ADD COLUMN IF NOT EXISTS adjuster_email text,
  ADD COLUMN IF NOT EXISTS adjuster_fax text;

-- Add adjuster fields to third_party_claims
ALTER TABLE third_party_claims
  ADD COLUMN IF NOT EXISTS adjuster_first_name text,
  ADD COLUMN IF NOT EXISTS adjuster_last_name text,
  ADD COLUMN IF NOT EXISTS adjuster_email text,
  ADD COLUMN IF NOT EXISTS adjuster_fax text;

-- Add comments
COMMENT ON COLUMN first_party_claims.adjuster_first_name IS 'Adjuster first name (separate from adjuster_name for better data structure)';
COMMENT ON COLUMN first_party_claims.adjuster_last_name IS 'Adjuster last name (separate from adjuster_name for better data structure)';
COMMENT ON COLUMN first_party_claims.adjuster_email IS 'Adjuster email address';
COMMENT ON COLUMN first_party_claims.adjuster_fax IS 'Adjuster fax number';
COMMENT ON COLUMN third_party_claims.adjuster_first_name IS 'Adjuster first name (separate from adjuster_name for better data structure)';
COMMENT ON COLUMN third_party_claims.adjuster_last_name IS 'Adjuster last name (separate from adjuster_name for better data structure)';
COMMENT ON COLUMN third_party_claims.adjuster_email IS 'Adjuster email address';
COMMENT ON COLUMN third_party_claims.adjuster_fax IS 'Adjuster fax number';
