/*
  # Add Casefile Enhancements
  
  ## Overview
  Adds sign-up date tracking, statute deadline calculation, and days open calculation
  to the casefiles table for enhanced case management and deadline tracking.
  
  ## Changes
  
  ### New Columns
  - `sign_up_date` (date) - When the client signed up for representation
  - `statute_deadline` (date) - Calculated deadline (accident date + 2 years)
  - `days_until_statute` (integer) - Computed column showing days remaining
  
  ### Functions
  - `calculate_days_open()` - Computed function for days since sign-up
  
  ## Notes
  - `client_count` and `defendant_count` already exist in schema
  - Generated columns improve query performance
  - All new columns have sensible defaults
*/

-- Add new columns to casefiles table
ALTER TABLE casefiles 
ADD COLUMN IF NOT EXISTS sign_up_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS statute_deadline date,
ADD COLUMN IF NOT EXISTS days_until_statute integer GENERATED ALWAYS AS (
  CASE 
    WHEN statute_deadline IS NOT NULL THEN statute_deadline - CURRENT_DATE
    ELSE NULL
  END
) STORED;

-- Create function for calculating days open
CREATE OR REPLACE FUNCTION calculate_days_open(sign_up_date date)
RETURNS integer AS $$
BEGIN
  IF sign_up_date IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN CURRENT_DATE - sign_up_date;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comment for documentation
COMMENT ON COLUMN casefiles.sign_up_date IS 'Date when client signed up for representation';
COMMENT ON COLUMN casefiles.statute_deadline IS 'Statute of limitations deadline (accident date + 2 years)';
COMMENT ON COLUMN casefiles.days_until_statute IS 'Computed: days remaining until statute deadline';

-- Create index for performance on statute deadline queries
CREATE INDEX IF NOT EXISTS idx_casefiles_statute_deadline ON casefiles(statute_deadline);
CREATE INDEX IF NOT EXISTS idx_casefiles_sign_up_date ON casefiles(sign_up_date);
