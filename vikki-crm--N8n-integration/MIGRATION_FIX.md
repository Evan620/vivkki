# Settlement Management Error Fix

## The Problem
The message "Settlement Tracking Not Configured" appears because:
- ✅ `settlements` table EXISTS (we checked)
- ❌ `settlement_offers` table is MISSING

The component tries to load both tables and shows the error message when ANY is missing.

## The Solution

### Option 1: Hide the Section (Recommended for now)
Just don't render the settlement management section at all if the tables don't exist. This is cleaner than showing an error.

### Option 2: Create the Missing Table
Run this SQL in Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS settlement_offers (
  id BIGSERIAL PRIMARY KEY,
  casefile_id BIGINT REFERENCES casefiles(id) ON DELETE CASCADE,
  offer_date DATE,
  offer_amount DECIMAL(12,2),
  offered_by VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending',
  response_type VARCHAR(50),
  response_date DATE,
  counter_amount DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE settlement_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for authenticated users"
ON settlement_offers FOR SELECT TO authenticated USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON settlement_offers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
ON settlement_offers FOR UPDATE TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_settlement_offers_casefile_id ON settlement_offers(casefile_id);
CREATE INDEX IF NOT EXISTS idx_settlement_offers_status ON settlement_offers(status);
```

## Current Behavior
The component is checking for the tables and handling errors gracefully. If you don't need settlement tracking yet, this is fine - it just shows the message.
