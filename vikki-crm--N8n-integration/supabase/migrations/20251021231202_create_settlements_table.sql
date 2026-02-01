-- Create settlements table for tracking case settlements
CREATE TABLE settlements (
  id BIGSERIAL PRIMARY KEY,
  casefile_id BIGINT REFERENCES casefiles(id) ON DELETE CASCADE,
  settlement_date DATE,
  gross_settlement DECIMAL(12,2),
  attorney_fee DECIMAL(12,2),
  attorney_fee_percentage DECIMAL(5,2) DEFAULT 33.33,
  case_expenses DECIMAL(12,2) DEFAULT 0,
  medical_liens DECIMAL(12,2),
  client_net DECIMAL(12,2),
  status VARCHAR(50) DEFAULT 'pending',
  settlement_type VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read for authenticated users"
  ON settlements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON settlements FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON settlements FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_settlements_casefile_id ON settlements(casefile_id);
CREATE INDEX idx_settlements_status ON settlements(status);
CREATE INDEX idx_settlements_settlement_date ON settlements(settlement_date);
