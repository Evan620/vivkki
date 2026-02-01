-- Create settlements table if it doesn't exist
CREATE TABLE IF NOT EXISTS settlements (
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

-- Enable RLS if not already enabled
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_settlements_casefile_id ON settlements(casefile_id);
CREATE INDEX IF NOT EXISTS idx_settlements_status ON settlements(status);
CREATE INDEX IF NOT EXISTS idx_settlements_settlement_date ON settlements(settlement_date);

-- Create RLS policies if they don't exist (check first)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'settlements' 
        AND policyname = 'Enable read for authenticated users'
    ) THEN
        CREATE POLICY "Enable read for authenticated users"
        ON settlements FOR SELECT
        TO authenticated
        USING (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'settlements' 
        AND policyname = 'Enable insert for authenticated users'
    ) THEN
        CREATE POLICY "Enable insert for authenticated users"
        ON settlements FOR INSERT
        TO authenticated
        WITH CHECK (true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'settlements' 
        AND policyname = 'Enable update for authenticated users'
    ) THEN
        CREATE POLICY "Enable update for authenticated users"
        ON settlements FOR UPDATE
        TO authenticated
        USING (true);
    END IF;
END $$;

-- Verify the table was created
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'settlements'
ORDER BY ordinal_position;
