-- Add case status, stage, and statute_alert columns if missing
ALTER TABLE public.casefiles
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'Active',
  ADD COLUMN IF NOT EXISTS stage text,
  ADD COLUMN IF NOT EXISTS statute_alert text;

-- Optional indexes for filters
CREATE INDEX IF NOT EXISTS idx_casefiles_status ON public.casefiles(status);
CREATE INDEX IF NOT EXISTS idx_casefiles_stage ON public.casefiles(stage);
CREATE INDEX IF NOT EXISTS idx_casefiles_statute_alert ON public.casefiles(statute_alert);

