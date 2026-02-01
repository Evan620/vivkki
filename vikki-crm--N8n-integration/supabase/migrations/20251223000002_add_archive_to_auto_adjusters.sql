/*
  # Add Archive Functionality to Auto Adjusters Table
  
  ## Overview
  Adds archive functionality to auto_adjusters table, allowing adjusters to be archived
  instead of deleted, preserving historical data.
  
  ## Changes
  - Add `is_archived` boolean column (default false)
  - Add `archived_at` timestamptz column (nullable)
  - Add index on `is_archived` for filtering performance
*/

-- Add archive columns
ALTER TABLE auto_adjusters
  ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- Create index for filtering archived adjusters
CREATE INDEX IF NOT EXISTS idx_auto_adjusters_is_archived ON auto_adjusters(is_archived);

-- Add comments
COMMENT ON COLUMN auto_adjusters.is_archived IS 'Whether the adjuster has been archived';
COMMENT ON COLUMN auto_adjusters.archived_at IS 'Timestamp when the adjuster was archived';

