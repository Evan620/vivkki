-- Create case_notes table for user-created notes (separate from work_logs)
-- Work logs track activities, case notes are user-created annotations

CREATE TABLE IF NOT EXISTS case_notes (
  id bigserial PRIMARY KEY,
  casefile_id bigint NOT NULL REFERENCES casefiles(id) ON DELETE CASCADE,
  note_text text NOT NULL,
  created_by text NOT NULL DEFAULT 'Admin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_case_notes_casefile_id ON case_notes(casefile_id);
CREATE INDEX IF NOT EXISTS idx_case_notes_created_at ON case_notes(created_at DESC);

-- Enable RLS
ALTER TABLE case_notes ENABLE ROW LEVEL SECURITY;

-- Policies for authenticated users
CREATE POLICY "Authenticated users can view case notes"
  ON case_notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert case notes"
  ON case_notes FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update case notes"
  ON case_notes FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete case notes"
  ON case_notes FOR DELETE
  TO authenticated
  USING (true);

-- Add comment for documentation
COMMENT ON TABLE case_notes IS 'User-created notes for cases (separate from activity work logs)';
COMMENT ON COLUMN case_notes.note_text IS 'The note content';
COMMENT ON COLUMN case_notes.created_by IS 'User who created the note';


