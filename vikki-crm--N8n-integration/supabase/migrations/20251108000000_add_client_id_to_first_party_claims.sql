-- Add client_id to first_party_claims table
-- This migration adds a client_id field to link first party claims to specific clients.
-- This is critical for multi-client cases where each client has their own auto insurance.

-- Add client_id column (nullable for backwards compatibility with existing claims)
ALTER TABLE first_party_claims
ADD COLUMN IF NOT EXISTS client_id bigint REFERENCES clients(id) ON DELETE CASCADE;

-- Create an index for better query performance
CREATE INDEX IF NOT EXISTS idx_first_party_claims_client_id ON first_party_claims(client_id);

-- For existing records without client_id, link them to the first client of their case
UPDATE first_party_claims fpc
SET client_id = (
  SELECT c.id
  FROM clients c
  WHERE c.casefile_id = fpc.casefile_id
  ORDER BY c.client_order, c.id
  LIMIT 1
)
WHERE client_id IS NULL;

