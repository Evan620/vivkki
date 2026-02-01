/*
  # Create claims and medical bills tables
  
  1. New Tables
    - `medical_bills` - Tracks medical provider records for each client
    - `first_party_claims` - Client's own insurance claims
    - `health_claims` - Client's health insurance claims
    - `third_party_claims` - Claims against defendant's insurance
  
  2. Security
    - Enable RLS on all tables
    - Add policies for public and authenticated users
*/

CREATE TABLE IF NOT EXISTS medical_bills (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  client_id bigint NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  medical_provider_id bigint NOT NULL REFERENCES medical_providers(id),
  hipaa_sent boolean DEFAULT false,
  bill_received boolean DEFAULT false,
  records_received boolean DEFAULT false,
  lien_filed boolean DEFAULT false,
  in_collections boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS first_party_claims (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  casefile_id bigint NOT NULL REFERENCES casefiles(id) ON DELETE CASCADE,
  auto_insurance_id bigint NOT NULL REFERENCES auto_insurance(id),
  policy_number text,
  claim_number text,
  has_medpay boolean DEFAULT false,
  medpay_amount text,
  has_um_coverage boolean DEFAULT false,
  um_amount text,
  lor_sent boolean DEFAULT false,
  loa_received boolean DEFAULT false,
  dec_sheets_received boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS health_claims (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  client_id bigint NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  health_insurance_id bigint NOT NULL REFERENCES health_insurance(id),
  member_id text,
  hipaa_sent boolean DEFAULT false,
  lor_sent boolean DEFAULT false,
  log_received boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS third_party_claims (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  defendant_id bigint NOT NULL REFERENCES defendants(id) ON DELETE CASCADE,
  auto_insurance_id bigint NOT NULL REFERENCES auto_insurance(id),
  claim_number text,
  lor_sent boolean DEFAULT false,
  loa_received boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE medical_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE first_party_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE third_party_claims ENABLE ROW LEVEL SECURITY;

-- Public policies
CREATE POLICY "Public users can view medical bills"
  ON medical_bills FOR SELECT TO anon USING (true);

CREATE POLICY "Public users can insert medical bills"
  ON medical_bills FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Public users can view first party claims"
  ON first_party_claims FOR SELECT TO anon USING (true);

CREATE POLICY "Public users can insert first party claims"
  ON first_party_claims FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Public users can view health claims"
  ON health_claims FOR SELECT TO anon USING (true);

CREATE POLICY "Public users can insert health claims"
  ON health_claims FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Public users can view third party claims"
  ON third_party_claims FOR SELECT TO anon USING (true);

CREATE POLICY "Public users can insert third party claims"
  ON third_party_claims FOR INSERT TO anon WITH CHECK (true);

-- Authenticated policies
CREATE POLICY "Authenticated users can view medical bills"
  ON medical_bills FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert medical bills"
  ON medical_bills FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update medical bills"
  ON medical_bills FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view first party claims"
  ON first_party_claims FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert first party claims"
  ON first_party_claims FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update first party claims"
  ON first_party_claims FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view health claims"
  ON health_claims FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert health claims"
  ON health_claims FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update health claims"
  ON health_claims FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view third party claims"
  ON third_party_claims FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert third party claims"
  ON third_party_claims FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update third party claims"
  ON third_party_claims FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);
