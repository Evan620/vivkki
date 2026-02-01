-- Add archive functionality to casefiles table
-- This allows cases to be archived and retrieved later

-- Add is_archived boolean column (default: false)
ALTER TABLE public.casefiles
  ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false NOT NULL;

-- Add archived_at timestamp column to track when case was archived
ALTER TABLE public.casefiles
  ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- Add index on is_archived for filtering performance
CREATE INDEX IF NOT EXISTS idx_casefiles_is_archived ON public.casefiles(is_archived);

-- Add index on archived_at for sorting archived cases
CREATE INDEX IF NOT EXISTS idx_casefiles_archived_at ON public.casefiles(archived_at);

-- Add comment for documentation
COMMENT ON COLUMN public.casefiles.is_archived IS 'Whether the case has been archived';
COMMENT ON COLUMN public.casefiles.archived_at IS 'Timestamp when the case was archived';


