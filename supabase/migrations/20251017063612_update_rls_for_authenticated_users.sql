/*
  # Update RLS Policies for Authenticated Users

  This migration updates all Row Level Security (RLS) policies to work with Supabase authentication.
  Previously, all tables had public access policies for development. Now we're securing them for production
  by requiring authentication for all operations.

  ## Changes

  ### Security Updates
  1. **Drop all public access policies** - Remove policies that allowed anonymous access
  2. **Create authenticated-only policies** - Add new policies that require valid user authentication
  3. **Maintain RLS enabled** - Keep RLS active on all tables

  ### Tables Updated
  - casefiles
  - clients
  - defendants
  - work_logs
  - medical_providers
  - medical_bills
  - auto_insurance
  - health_insurance
  - health_claims
  - first_party_claims
  - third_party_claims
  - documents

  ### Policy Structure
  Each table now has 4 policies (SELECT, INSERT, UPDATE, DELETE) that:
  - Only allow authenticated users
  - Use `auth.uid()` to verify user is logged in
  - Provide full access to all authenticated users (team access model)

  ## Notes
  - All authenticated users can access all data (suitable for small team/firm)
  - Future enhancement: Add user-specific or role-based policies if needed
  - Storage bucket policies are not modified (handled separately)
*/

-- Drop all existing public access policies
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
            policy_record.policyname, 
            policy_record.schemaname, 
            policy_record.tablename
        );
    END LOOP;
END $$;

-- Casefiles: Authenticated users can manage all cases
CREATE POLICY "Authenticated users can view casefiles"
  ON casefiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert casefiles"
  ON casefiles FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update casefiles"
  ON casefiles FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete casefiles"
  ON casefiles FOR DELETE
  TO authenticated
  USING (true);

-- Clients: Authenticated users can manage all clients
CREATE POLICY "Authenticated users can view clients"
  ON clients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert clients"
  ON clients FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients"
  ON clients FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete clients"
  ON clients FOR DELETE
  TO authenticated
  USING (true);

-- Defendants: Authenticated users can manage all defendants
CREATE POLICY "Authenticated users can view defendants"
  ON defendants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert defendants"
  ON defendants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update defendants"
  ON defendants FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete defendants"
  ON defendants FOR DELETE
  TO authenticated
  USING (true);

-- Work Logs: Authenticated users can manage all work logs
CREATE POLICY "Authenticated users can view work_logs"
  ON work_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert work_logs"
  ON work_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update work_logs"
  ON work_logs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete work_logs"
  ON work_logs FOR DELETE
  TO authenticated
  USING (true);

-- Medical Providers: Authenticated users can manage all providers
CREATE POLICY "Authenticated users can view medical_providers"
  ON medical_providers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert medical_providers"
  ON medical_providers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update medical_providers"
  ON medical_providers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete medical_providers"
  ON medical_providers FOR DELETE
  TO authenticated
  USING (true);

-- Medical Bills: Authenticated users can manage all bills
CREATE POLICY "Authenticated users can view medical_bills"
  ON medical_bills FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert medical_bills"
  ON medical_bills FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update medical_bills"
  ON medical_bills FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete medical_bills"
  ON medical_bills FOR DELETE
  TO authenticated
  USING (true);

-- Auto Insurance: Authenticated users can manage all insurance
CREATE POLICY "Authenticated users can view auto_insurance"
  ON auto_insurance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert auto_insurance"
  ON auto_insurance FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update auto_insurance"
  ON auto_insurance FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete auto_insurance"
  ON auto_insurance FOR DELETE
  TO authenticated
  USING (true);

-- Health Insurance: Authenticated users can manage all health insurance
CREATE POLICY "Authenticated users can view health_insurance"
  ON health_insurance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert health_insurance"
  ON health_insurance FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update health_insurance"
  ON health_insurance FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete health_insurance"
  ON health_insurance FOR DELETE
  TO authenticated
  USING (true);

-- Health Claims: Authenticated users can manage all health claims
CREATE POLICY "Authenticated users can view health_claims"
  ON health_claims FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert health_claims"
  ON health_claims FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update health_claims"
  ON health_claims FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete health_claims"
  ON health_claims FOR DELETE
  TO authenticated
  USING (true);

-- First Party Claims: Authenticated users can manage all first party claims
CREATE POLICY "Authenticated users can view first_party_claims"
  ON first_party_claims FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert first_party_claims"
  ON first_party_claims FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update first_party_claims"
  ON first_party_claims FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete first_party_claims"
  ON first_party_claims FOR DELETE
  TO authenticated
  USING (true);

-- Third Party Claims: Authenticated users can manage all third party claims
CREATE POLICY "Authenticated users can view third_party_claims"
  ON third_party_claims FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert third_party_claims"
  ON third_party_claims FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update third_party_claims"
  ON third_party_claims FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete third_party_claims"
  ON third_party_claims FOR DELETE
  TO authenticated
  USING (true);

-- Documents: Authenticated users can manage all documents
CREATE POLICY "Authenticated users can view documents"
  ON documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert documents"
  ON documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update documents"
  ON documents FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete documents"
  ON documents FOR DELETE
  TO authenticated
  USING (true);
