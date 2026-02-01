/*
  # Create Health Adjusters Table
  
  ## Overview
  Creates a new table to track health insurance adjusters with full contact information
  for managing claims and communications.
  
  ## New Table: health_adjusters
  
  ### Columns
  - `id` (bigserial, primary key) - Unique adjuster identifier
  - `health_insurance_id` (bigint, foreign key) - Reference to health insurance company
  - `first_name` (text) - Adjuster's first name
  - `middle_name` (text) - Adjuster's middle name
  - `last_name` (text) - Adjuster's last name
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
*/

-- Create health_adjusters table
CREATE TABLE IF NOT EXISTS health_adjusters (
  id bigserial PRIMARY KEY,
  health_insurance_id bigint REFERENCES health_insurance(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_health_adjusters_insurance ON health_adjusters(health_insurance_id);
CREATE INDEX IF NOT EXISTS idx_health_adjusters_name ON health_adjusters(last_name, first_name);

-- Enable Row Level Security
ALTER TABLE health_adjusters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can view health adjusters" ON health_adjusters;
DROP POLICY IF EXISTS "Authenticated users can insert health adjusters" ON health_adjusters;
DROP POLICY IF EXISTS "Authenticated users can update health adjusters" ON health_adjusters;
DROP POLICY IF EXISTS "Authenticated users can delete health adjusters" ON health_adjusters;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view health adjusters"
  ON health_adjusters FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert health adjusters"
  ON health_adjusters FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update health adjusters"
  ON health_adjusters FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete health adjusters"
  ON health_adjusters FOR DELETE
  TO authenticated
  USING (true);

-- Add comments for documentation
COMMENT ON TABLE health_adjusters IS 'Health insurance adjusters with full contact information';
COMMENT ON COLUMN health_adjusters.health_insurance_id IS 'Reference to the health insurance company this adjuster works for';
COMMENT ON COLUMN health_adjusters.email IS 'Primary email for adjuster communications';
COMMENT ON COLUMN health_adjusters.phone IS 'Primary phone number for adjuster contact';
COMMENT ON COLUMN health_adjusters.fax IS 'Fax number for adjuster communications';

