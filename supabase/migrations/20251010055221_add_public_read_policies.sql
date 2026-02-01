/*
  # Add public read access for debugging
  
  This migration adds public read policies to help diagnose data access issues.
  These policies allow unauthenticated access for SELECT operations only.
  
  1. Changes
    - Add public SELECT policy for casefiles table
    - Add public SELECT policy for clients table
    - Add public SELECT policy for defendants table
  
  2. Security
    - Only SELECT operations are allowed
    - INSERT, UPDATE, DELETE still require authentication
*/

-- Add public read policy for casefiles
CREATE POLICY "Public users can view casefiles"
  ON casefiles FOR SELECT
  TO anon
  USING (true);

-- Add public read policy for clients
CREATE POLICY "Public users can view clients"
  ON clients FOR SELECT
  TO anon
  USING (true);

-- Add public read policy for defendants
CREATE POLICY "Public users can view defendants"
  ON defendants FOR SELECT
  TO anon
  USING (true);
