-- Create settlement_offers table for tracking all settlement offers
CREATE TABLE settlement_offers (
  id BIGSERIAL PRIMARY KEY,
  casefile_id BIGINT REFERENCES casefiles(id) ON DELETE CASCADE,
  offer_date DATE NOT NULL,
  offer_amount DECIMAL(12,2) NOT NULL,
  offered_by VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  response_date DATE,
  response_type VARCHAR(50),
  counter_amount DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE settlement_offers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read for authenticated users"
  ON settlement_offers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for authenticated users"
  ON settlement_offers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
  ON settlement_offers FOR UPDATE
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX idx_settlement_offers_casefile_id ON settlement_offers(casefile_id);
CREATE INDEX idx_settlement_offers_status ON settlement_offers(status);
CREATE INDEX idx_settlement_offers_offer_date ON settlement_offers(offer_date);
