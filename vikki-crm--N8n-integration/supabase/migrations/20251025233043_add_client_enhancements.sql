/*
  # Add Client Enhancements
  
  ## Overview
  Adds primary key and ordering support to the clients table for multi-client case management.
  
  ## Changes
  
  ### New Columns
  - `id` (bigserial, primary key) - Unique client identifier
  - `client_order` (integer) - Order of clients within a case (1, 2, 3, etc.)
  
  ### Indexes
  - Composite index on (casefile_id, client_order) for efficient ordering
  
  ## Notes
  - `is_driver` already exists in schema (line 129)
  - Primary key was missing from original schema
  - client_order defaults to 1 for backwards compatibility
*/

-- Add primary key if missing (check if it exists first)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'clients' AND column_name = 'id'
  ) THEN
    ALTER TABLE clients ADD COLUMN id bigserial PRIMARY KEY;
  END IF;
END $$;

-- Add client ordering column
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS client_order integer DEFAULT 1;

-- Create index for efficient ordering queries
CREATE INDEX IF NOT EXISTS idx_clients_order ON clients(casefile_id, client_order);

-- Add constraint to ensure positive order numbers
ALTER TABLE clients 
ADD CONSTRAINT client_order_positive 
CHECK (client_order > 0);

-- Add comments for documentation
COMMENT ON COLUMN clients.id IS 'Unique client identifier';
COMMENT ON COLUMN clients.client_order IS 'Order of client within case (1=first, 2=second, etc.)';
COMMENT ON COLUMN clients.is_driver IS 'Whether this client was the driver of the vehicle';
