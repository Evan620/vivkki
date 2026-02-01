/*
  # Add UPDATE policies for all tables
  
  1. Problem
    - Users can read and create data but cannot update
    - Missing UPDATE policies for Row Level Security
  
  2. Solution
    - Add UPDATE policies for all editable tables
    - Allow public users to update their data
  
  3. Tables Affected
    - casefiles (stage, status, accident details)
    - clients (client information)
    - defendants (defendant information)
    - medical_bills (bill tracking checkboxes)
    - first_party_claims (insurance claims)
    - third_party_claims (insurance claims)
    - health_claims (insurance claims)
    - medical_providers (provider information)
    - auto_insurance (insurance details)
    - health_insurance (insurance details)
*/

-- Casefiles UPDATE policy
CREATE POLICY "Allow public to update casefiles"
  ON casefiles
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Clients UPDATE policy
CREATE POLICY "Allow public to update clients"
  ON clients
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Defendants UPDATE policy
CREATE POLICY "Allow public to update defendants"
  ON defendants
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Medical bills UPDATE policy
CREATE POLICY "Allow public to update medical_bills"
  ON medical_bills
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Medical providers UPDATE policy
CREATE POLICY "Allow public to update medical_providers"
  ON medical_providers
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- First party claims UPDATE policy
CREATE POLICY "Allow public to update first_party_claims"
  ON first_party_claims
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Third party claims UPDATE policy
CREATE POLICY "Allow public to update third_party_claims"
  ON third_party_claims
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Health claims UPDATE policy
CREATE POLICY "Allow public to update health_claims"
  ON health_claims
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Auto insurance UPDATE policy
CREATE POLICY "Allow public to update auto_insurance"
  ON auto_insurance
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Health insurance UPDATE policy
CREATE POLICY "Allow public to update health_insurance"
  ON health_insurance
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);
