/*
  # Add Defendant Liability Percentage
  
  ## Overview
  Adds liability percentage tracking to defendants table for multi-defendant cases
  where fault may be shared among multiple parties.
  
  ## Changes
  
  ### New Column
  - `liability_percentage` (integer) - Percentage of fault assigned to this defendant (0-100)
  
  ### Constraints
  - Percentage must be between 0 and 100
  - Defaults to 100% (fully at fault)
  
  ## Notes
  - Supports shared fault scenarios
  - Default 100% maintains backwards compatibility
  - Constraint ensures valid percentage values
*/

-- Add liability percentage column to defendants table
ALTER TABLE defendants
ADD COLUMN IF NOT EXISTS liability_percentage integer DEFAULT 100;

-- Add constraint to ensure percentage is between 0-100
ALTER TABLE defendants 
ADD CONSTRAINT liability_percentage_valid 
CHECK (liability_percentage >= 0 AND liability_percentage <= 100);

-- Add comment for documentation
COMMENT ON COLUMN defendants.liability_percentage IS 'Percentage of fault assigned to this defendant (0-100)';

-- Create index for liability queries
CREATE INDEX IF NOT EXISTS idx_defendants_liability ON defendants(liability_percentage);
