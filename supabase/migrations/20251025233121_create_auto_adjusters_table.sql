/*
  # Create Auto Adjusters Table
  
  ## Overview
  Creates a new table to track auto insurance adjusters with full contact information
  for managing claims and communications.
  
  ## New Table: auto_adjusters
  
  ### Columns
  - `id` (bigserial, primary key) - Unique adjuster identifier
  - `third_party_claim_id` (bigint, foreign key) - Reference to third party claim
  - `first_name` (text) - Adjuster's first name
  - `last_name` (text) - Adjuster's last name
  - `email` (text) - Adjuster's email address
  - `phone` (text) - Adjuster's phone number
  - `mailing_address` (text) - Adjuster's mailing address
  - `city` (text) - Adjuster's city
  - `state` (text) - Adjuster's state
  - `zip_code` (text) - Adjuster's zip code
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record last update timestamp
  
  ### Security
  - Row Level Security enabled
  - Policy for authenticated users to manage adjusters
  
  ### Indexes
  - Index on third_party_claim_id for efficient lookups
*/

-- Create auto_adjusters table
CREATE TABLE IF NOT EXISTS auto_adjusters (
  id bigserial PRIMARY KEY,
  third_party_claim_id bigint REFERENCES third_party_claims(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text DEFAULT '',
  phone text DEFAULT '',
  mailing_address text DEFAULT '',
  city text DEFAULT '',
  state text DEFAULT '',
  zip_code text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_adjusters_claim ON auto_adjusters(third_party_claim_id);
CREATE INDEX IF NOT EXISTS idx_adjusters_name ON auto_adjusters(last_name, first_name);

-- Enable Row Level Security
ALTER TABLE auto_adjusters ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view adjusters"
  ON auto_adjusters FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert adjusters"
  ON auto_adjusters FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update adjusters"
  ON auto_adjusters FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete adjusters"
  ON auto_adjusters FOR DELETE
  TO authenticated
  USING (true);

-- Add comments for documentation
COMMENT ON TABLE auto_adjusters IS 'Auto insurance adjusters with full contact information';
COMMENT ON COLUMN auto_adjusters.third_party_claim_id IS 'Reference to the third party claim this adjuster handles';
COMMENT ON COLUMN auto_adjusters.email IS 'Primary email for adjuster communications';
COMMENT ON COLUMN auto_adjusters.phone IS 'Primary phone number for adjuster contact';
COMMENT ON COLUMN auto_adjusters.mailing_address IS 'Mailing address for formal correspondence';
