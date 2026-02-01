-- Add relationship and shared contact fields to clients table

ALTER TABLE clients 
  ADD COLUMN IF NOT EXISTS relationship_to_primary VARCHAR(50),
  ADD COLUMN IF NOT EXISTS uses_primary_address BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS uses_primary_phone BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN clients.relationship_to_primary IS 'Relationship to the primary client (e.g., Child, Spouse, Friend)';
COMMENT ON COLUMN clients.uses_primary_address IS 'Whether this client uses the same address as the primary client';
COMMENT ON COLUMN clients.uses_primary_phone IS 'Whether this client uses the same phone as the primary client';

