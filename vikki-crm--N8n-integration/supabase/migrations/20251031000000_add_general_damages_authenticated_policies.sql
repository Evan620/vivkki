-- Create general_damages table and add RLS policies for authenticated users
-- This migration creates the table if it doesn't exist and adds all necessary policies

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS general_damages (
  id BIGSERIAL PRIMARY KEY,
  casefile_id BIGINT REFERENCES casefiles(id) ON DELETE CASCADE,
  emotional_distress DECIMAL(12,2) DEFAULT 0,
  duties_under_duress DECIMAL(12,2) DEFAULT 0,
  pain_and_suffering DECIMAL(12,2) DEFAULT 0,
  loss_of_enjoyment DECIMAL(12,2) DEFAULT 0,
  loss_of_consortium DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) GENERATED ALWAYS AS (
    emotional_distress + duties_under_duress + pain_and_suffering + 
    loss_of_enjoyment + loss_of_consortium
  ) STORED,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_general_damages_casefile_id ON general_damages(casefile_id);

-- Enable RLS
ALTER TABLE general_damages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (from original migration or previous attempts)
DROP POLICY IF EXISTS "Enable read for authenticated users" ON general_damages;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON general_damages;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON general_damages;
DROP POLICY IF EXISTS "Authenticated users can view general_damages" ON general_damages;
DROP POLICY IF EXISTS "Authenticated users can insert general_damages" ON general_damages;
DROP POLICY IF EXISTS "Authenticated users can update general_damages" ON general_damages;
DROP POLICY IF EXISTS "Authenticated users can delete general_damages" ON general_damages;

-- Create SELECT policy for authenticated users
CREATE POLICY "Authenticated users can view general_damages"
  ON general_damages FOR SELECT
  TO authenticated
  USING (true);

-- Create INSERT policy for authenticated users
CREATE POLICY "Authenticated users can insert general_damages"
  ON general_damages FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create UPDATE policy for authenticated users
CREATE POLICY "Authenticated users can update general_damages"
  ON general_damages FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create DELETE policy for authenticated users
CREATE POLICY "Authenticated users can delete general_damages"
  ON general_damages FOR DELETE
  TO authenticated
  USING (true);
