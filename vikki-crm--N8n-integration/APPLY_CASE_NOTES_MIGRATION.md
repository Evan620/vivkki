# Apply Case Notes Migration

## The Problem
You're seeing a 500 Internal Server Error because the `case_notes` table doesn't exist yet in your Supabase database.

## The Solution

### Option 1: Run Migration via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `supabase/migrations/20251222000000_create_case_notes_table.sql`
5. Click **Run** or press `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

### Option 2: Run Migration via Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db push
```

Or manually:

```bash
supabase migration up
```

### Option 3: Direct SQL Execution

Run this SQL in your Supabase SQL Editor:

```sql
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
```

## After Running Migration

1. Refresh your browser
2. The 500 error should be resolved
3. The Case Notes component should work properly
4. You can now add, edit, and delete case notes

## Temporary Workaround

If you can't run the migration right now, the component will:
- Show an empty notes list (no error)
- Display a helpful message if you try to add a note
- Not crash the application

The error handling has been improved to gracefully handle missing tables.



