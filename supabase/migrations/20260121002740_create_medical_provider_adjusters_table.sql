/*
  # Create Medical Provider Adjusters Table
  
  ## Overview
  Creates a new table to track medical provider adjusters with full contact information
  for managing communications and records requests.
  
  ## New Table: medical_provider_adjusters
  
  ### Columns
  - `id` (bigserial, primary key) - Unique adjuster identifier
  - `medical_provider_id` (bigint, foreign key) - Reference to medical provider
  - `first_name` (text, NOT NULL) - Adjuster's first name
  - `middle_name` (text) - Adjuster's middle name
  - `last_name` (text, NOT NULL) - Adjuster's last name
  - `email` (text) - Adjuster's email address
  - `phone` (text) - Adjuster's phone number
  - `fax` (text) - Adjuster's fax number
  - `street_address` (text) - Adjuster's street address
  - `city` (text) - Adjuster's city
  - `state` (text) - Adjuster's state
  - `zip_code` (text) - Adjuster's zip code
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record last update timestamp
  
  ### Security
  - Row Level Security enabled
  - Policy for authenticated users to manage adjusters
  
  ### Indexes
  - Index on medical_provider_id for efficient lookups
  - Index on name fields for searching
*/

-- Create medical_provider_adjusters table
CREATE TABLE IF NOT EXISTS medical_provider_adjusters (
  id bigserial PRIMARY KEY,
  medical_provider_id bigint REFERENCES medical_providers(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  middle_name text DEFAULT '',
  last_name text NOT NULL,
  email text DEFAULT '',
  phone text DEFAULT '',
  fax text DEFAULT '',
  street_address text DEFAULT '',
  city text DEFAULT '',
  state text DEFAULT '',
  zip_code text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_medical_provider_adjusters_provider ON medical_provider_adjusters(medical_provider_id);
CREATE INDEX IF NOT EXISTS idx_medical_provider_adjusters_name ON medical_provider_adjusters(last_name, first_name);

-- Enable Row Level Security
ALTER TABLE medical_provider_adjusters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view medical provider adjusters" ON medical_provider_adjusters;
DROP POLICY IF EXISTS "Authenticated users can insert medical provider adjusters" ON medical_provider_adjusters;
DROP POLICY IF EXISTS "Authenticated users can update medical provider adjusters" ON medical_provider_adjusters;
DROP POLICY IF EXISTS "Authenticated users can delete medical provider adjusters" ON medical_provider_adjusters;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view medical provider adjusters"
  ON medical_provider_adjusters FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert medical provider adjusters"
  ON medical_provider_adjusters FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update medical provider adjusters"
  ON medical_provider_adjusters FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete medical provider adjusters"
  ON medical_provider_adjusters FOR DELETE
  TO authenticated
  USING (true);

-- Add comments
COMMENT ON TABLE medical_provider_adjusters IS 'Medical provider adjusters with full contact information';
COMMENT ON COLUMN medical_provider_adjusters.medical_provider_id IS 'Reference to the medical provider this adjuster works for';
COMMENT ON COLUMN medical_provider_adjusters.email IS 'Primary email for adjuster communications';
COMMENT ON COLUMN medical_provider_adjusters.phone IS 'Primary phone number for adjuster contact';
COMMENT ON COLUMN medical_provider_adjusters.fax IS 'Fax number for adjuster communications';
