/*
  # Add public insert policies for case submission
  
  1. Policies
    - Add INSERT policies for public (anon) users on all case-related tables
    - This allows the intake form to create new cases without authentication
  
  2. Tables affected
    - casefiles
    - clients
    - defendants
*/

-- Casefiles public insert policy
CREATE POLICY "Public users can insert casefiles"
  ON casefiles FOR INSERT
  TO anon
  WITH CHECK (true);

-- Clients public insert policy
CREATE POLICY "Public users can insert clients"
  ON clients FOR INSERT
  TO anon
  WITH CHECK (true);

-- Defendants public insert policy
CREATE POLICY "Public users can insert defendants"
  ON defendants FOR INSERT
  TO anon
  WITH CHECK (true);

-- Work logs public insert policy (if not already exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'work_logs' 
    AND policyname = 'Public users can insert work logs'
  ) THEN
    CREATE POLICY "Public users can insert work logs"
      ON work_logs FOR INSERT
      TO anon
      WITH CHECK (true);
  END IF;
END $$;
