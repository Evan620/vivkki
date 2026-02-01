-- Remove Litigation stage from database constraints
-- Update any cases with Litigation stage to Closed stage

-- Update existing cases with Litigation stage to Closed
UPDATE public.casefiles
SET stage = 'Closed', status = 'Closed'
WHERE stage = 'Litigation';

-- Drop and recreate stage CHECK constraint without Litigation
ALTER TABLE public.casefiles
  DROP CONSTRAINT IF EXISTS casefiles_stage_check;

ALTER TABLE public.casefiles
  ADD CONSTRAINT casefiles_stage_check
  CHECK (stage IN ('Intake', 'Processing', 'Demand', 'Closed'));

-- Update status CHECK constraint to remove 'Filed' status
ALTER TABLE public.casefiles
  DROP CONSTRAINT IF EXISTS casefiles_status_check;

ALTER TABLE public.casefiles
  ADD CONSTRAINT casefiles_status_check
  CHECK (status IN (
    'New', 'Incomplete',
    'Treating', 'Awaiting B&R', 'Awaiting Subro',
    'Ready for Demand', 'Demand Sent', 'Counter Received', 'Counter Sent', 
    'Reduction Sent', 'Proposed Settlement Statement Sent', 'Release Sent', 
    'Payment Instructions Sent',
    'Closed'
  ));

-- Update comment
COMMENT ON COLUMN public.casefiles.stage IS 'Case stage: Intake, Processing, Demand, or Closed';


