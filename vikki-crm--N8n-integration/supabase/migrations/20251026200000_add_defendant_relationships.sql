-- Add defendant relationship tracking
-- Allows linking defendants to each other (e.g., mother-child relationships)

ALTER TABLE defendants
ADD COLUMN IF NOT EXISTS related_to_defendant_id bigint REFERENCES defendants(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS relationship_type text DEFAULT '';

-- Create index for relationship queries
CREATE INDEX IF NOT EXISTS idx_defendants_related ON defendants(related_to_defendant_id);

-- Add comment explaining the fields
COMMENT ON COLUMN defendants.related_to_defendant_id IS 'Link to another defendant in this case (e.g., parent-child relationships)';
COMMENT ON COLUMN defendants.relationship_type IS 'Type of relationship: Mother, Father, Spouse, Guardian, Other';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Defendant relationship tracking added successfully!';
END $$;

