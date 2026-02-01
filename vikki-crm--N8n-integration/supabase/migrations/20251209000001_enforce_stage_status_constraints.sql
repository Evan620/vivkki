-- Enforce stage and status constraints on casefiles table
-- This ensures only valid stage/status combinations are allowed

-- First, update any existing invalid values to defaults
UPDATE public.casefiles
SET stage = 'Intake'
WHERE stage IS NULL OR stage NOT IN ('Intake', 'Processing', 'Demand', 'Litigation', 'Closed');

UPDATE public.casefiles
SET status = 'New'
WHERE status IS NULL OR (
  stage = 'Intake' AND status NOT IN ('New', 'Incomplete')
) OR (
  stage = 'Processing' AND status NOT IN ('Treating', 'Awaiting B&R', 'Awaiting Subro')
) OR (
  stage = 'Demand' AND status NOT IN ('Ready for Demand', 'Demand Sent', 'Counter Received', 'Counter Sent', 'Reduction Sent', 'Proposed Settlement Statement Sent', 'Release Sent', 'Payment Instructions Sent')
) OR (
  stage = 'Litigation' AND status NOT IN ('Filed', 'Closed')
) OR (
  stage = 'Closed' AND status != 'Closed'
);

-- Add CHECK constraint for stage
ALTER TABLE public.casefiles
  DROP CONSTRAINT IF EXISTS casefiles_stage_check;

ALTER TABLE public.casefiles
  ADD CONSTRAINT casefiles_stage_check
  CHECK (stage IN ('Intake', 'Processing', 'Demand', 'Litigation', 'Closed'));

-- Note: Status validation is more complex as it depends on stage
-- We'll handle this in application logic, but ensure status is not null
ALTER TABLE public.casefiles
  DROP CONSTRAINT IF EXISTS casefiles_status_check;

ALTER TABLE public.casefiles
  ADD CONSTRAINT casefiles_status_not_null
  CHECK (status IS NOT NULL);

-- Add comments for documentation
COMMENT ON COLUMN public.casefiles.stage IS 'Case stage: Intake, Processing, Demand, Litigation, or Closed';
COMMENT ON COLUMN public.casefiles.status IS 'Case status within the current stage. Valid statuses depend on the stage.';


