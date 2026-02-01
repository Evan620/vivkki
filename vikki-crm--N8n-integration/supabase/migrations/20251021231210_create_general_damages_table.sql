-- Create general_damages table for demand letter calculations
CREATE TABLE general_damages (
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

-- Enable RLS
ALTER TABLE general_damages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read for authenticated users"
  ON general_damages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON general_damages FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON general_damages FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_general_damages_casefile_id ON general_damages(casefile_id);
