/*
  # Add Health Claims Subrogation and Lien Fields

  1. Changes
    - Add policy information fields (policy_number, group_number, subscriber_name, relationship_to_client, phone)
    - Add subrogation tracking fields (subrogation_claim_filed, subrogation_amount)
    - Add lien tracking fields (lien_amount, lien_filed_date, lien_negotiated, final_lien_amount)
    - Add lien satisfaction fields (lien_satisfied, satisfaction_date)
    - Add financial tracking (amount_paid_by_insurance)
    - Add notes field

  2. Security
    - No RLS changes needed (existing policies cover new columns)
*/

-- Add policy information
ALTER TABLE health_claims 
ADD COLUMN IF NOT EXISTS policy_number text,
ADD COLUMN IF NOT EXISTS group_number text,
ADD COLUMN IF NOT EXISTS subscriber_name text,
ADD COLUMN IF NOT EXISTS relationship_to_client text,
ADD COLUMN IF NOT EXISTS phone text;

-- Add subrogation tracking
ALTER TABLE health_claims
ADD COLUMN IF NOT EXISTS subrogation_claim_filed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS subrogation_amount numeric(12, 2) DEFAULT 0;

-- Add lien tracking
ALTER TABLE health_claims
ADD COLUMN IF NOT EXISTS lien_amount numeric(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS lien_filed_date date,
ADD COLUMN IF NOT EXISTS lien_negotiated boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS final_lien_amount numeric(12, 2) DEFAULT 0;

-- Add lien satisfaction
ALTER TABLE health_claims
ADD COLUMN IF NOT EXISTS lien_satisfied boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS satisfaction_date date;

-- Add financial tracking
ALTER TABLE health_claims
ADD COLUMN IF NOT EXISTS amount_paid_by_insurance numeric(12, 2) DEFAULT 0;

-- Add notes
ALTER TABLE health_claims
ADD COLUMN IF NOT EXISTS notes text;
