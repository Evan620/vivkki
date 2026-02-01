-- Create mileage_log table for tracking medical appointment travel
CREATE TABLE mileage_log (
  id BIGSERIAL PRIMARY KEY,
  casefile_id BIGINT REFERENCES casefiles(id) ON DELETE CASCADE,
  client_id BIGINT REFERENCES clients(id) ON DELETE CASCADE,
  medical_provider_id BIGINT REFERENCES medical_providers(id),
  date DATE NOT NULL,
  miles DECIMAL(10,2) NOT NULL,
  rate_per_mile DECIMAL(5,2) DEFAULT 0.67,
  total DECIMAL(10,2) GENERATED ALWAYS AS (miles * rate_per_mile) STORED,
  purpose TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE mileage_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read for authenticated users"
  ON mileage_log FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON mileage_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON mileage_log FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_mileage_log_casefile_id ON mileage_log(casefile_id);
CREATE INDEX idx_mileage_log_client_id ON mileage_log(client_id);
CREATE INDEX idx_mileage_log_date ON mileage_log(date);
