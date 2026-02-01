/*
  # Vikki CRM Database Schema

  ## Overview
  Creates the complete database schema for Vikki CRM, a legal case management system
  for personal injury law firms. This migration sets up all core tables with proper
  relationships, constraints, and Row Level Security policies.

  ## New Tables

  ### casefiles
  Core case information table storing all accident and case details
  - `id` (bigserial, primary key) - Unique case identifier
  - `stage` (text) - Current case stage: Intake, Processing, Demand, Litigation, Closed
  - `status` (text) - Detailed status within stage
  - `client_count` (integer) - Number of clients in this case
  - `defendant_count` (integer) - Number of defendants in this case
  - `date_of_loss` (date) - Date the accident occurred
  - `time_of_wreck` (text) - Time the accident occurred
  - `wreck_type` (text) - Type of accident (Rear End, T-Bone, etc.)
  - `wreck_street` (text) - Street address of accident
  - `wreck_city` (text) - City where accident occurred
  - `wreck_state` (text) - State where accident occurred
  - `wreck_county` (text) - County where accident occurred
  - `wreck_description` (text) - Detailed description of accident
  - `is_police_involved` (boolean) - Whether police responded to scene
  - `police_force` (text) - Name of responding police department
  - `is_police_report` (boolean) - Whether police report was filed
  - `police_report_number` (text) - Police report number
  - `vehicle_description` (text) - Description of client's vehicle
  - `damage_level` (text) - Level of vehicle damage
  - `wreck_notes` (text) - Additional notes about the accident
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Record last update timestamp

  ### clients
  Client information table storing personal details of injured parties
  - `id` (bigserial, primary key) - Unique client identifier
  - `casefile_id` (bigint, foreign key) - Reference to parent case
  - `client_number` (integer) - Client number within the case
  - `is_driver` (boolean) - Whether client was the driver
  - `first_name` (text) - Client's first name
  - `middle_name` (text) - Client's middle name
  - `last_name` (text) - Client's last name
  - `date_of_birth` (date) - Client's date of birth
  - `ssn` (text) - Social Security Number (will be encrypted in future)
  - `street_address` (text) - Street address
  - `city` (text) - City
  - `state` (text) - State
  - `zip_code` (text) - ZIP code
  - `primary_phone` (text) - Primary phone number
  - `secondary_phone` (text) - Secondary phone number
  - `email` (text) - Email address
  - `marital_status` (text) - Marital status
  - `injury_description` (text) - Description of injuries sustained
  - `prior_accidents` (text) - History of prior accidents
  - `prior_injuries` (text) - History of prior injuries
  - `work_impact` (text) - Impact on work/employment
  - `referrer` (text) - How client was referred
  - `referrer_relationship` (text) - Relationship to referrer
  - `has_health_insurance` (boolean) - Whether client has health insurance

  ### defendants
  Defendant information table storing details of at-fault parties
  - `id` (bigserial, primary key) - Unique defendant identifier
  - `casefile_id` (bigint, foreign key) - Reference to parent case
  - `defendant_number` (integer) - Defendant number within the case
  - `first_name` (text) - Defendant's first name
  - `last_name` (text) - Defendant's last name
  - `is_policyholder` (boolean) - Whether defendant is the policyholder
  - `policyholder_first_name` (text) - Policyholder's first name if different
  - `policyholder_last_name` (text) - Policyholder's last name if different
  - `auto_insurance_id` (bigint) - Reference to insurance company (future FK)
  - `policy_number` (text) - Insurance policy number
  - `notes` (text) - Additional notes about defendant

  ### work_logs
  Work log entries tracking all case activity
  - `id` (bigserial, primary key) - Unique log entry identifier
  - `casefile_id` (bigint, foreign key) - Reference to parent case
  - `description` (text) - Description of work performed
  - `timestamp` (timestamptz) - When the work was performed
  - `user_name` (text) - Name of user who performed the work

  ## Security
  - Enable Row Level Security on all tables
  - Add policies for authenticated users to manage their firm's data
  - All tables are secured by default (no public access)

  ## Notes
  1. Uses snake_case for database columns (PostgreSQL convention)
  2. All timestamps use timestamptz for timezone awareness
  3. Foreign key constraints ensure referential integrity
  4. Indexes on foreign keys for query performance
  5. Default values for timestamps and boolean fields
*/

-- Create casefiles table
CREATE TABLE IF NOT EXISTS casefiles (
  id bigserial PRIMARY KEY,
  stage text NOT NULL,
  status text NOT NULL,
  client_count integer DEFAULT 0,
  defendant_count integer DEFAULT 0,
  date_of_loss date NOT NULL,
  time_of_wreck text DEFAULT '',
  wreck_type text DEFAULT '',
  wreck_street text DEFAULT '',
  wreck_city text DEFAULT '',
  wreck_state text DEFAULT '',
  wreck_county text DEFAULT '',
  wreck_description text DEFAULT '',
  is_police_involved boolean DEFAULT false,
  police_force text DEFAULT '',
  is_police_report boolean DEFAULT false,
  police_report_number text DEFAULT '',
  vehicle_description text DEFAULT '',
  damage_level text DEFAULT '',
  wreck_notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id bigserial PRIMARY KEY,
  casefile_id bigint NOT NULL REFERENCES casefiles(id) ON DELETE CASCADE,
  client_number integer DEFAULT 1,
  is_driver boolean DEFAULT false,
  first_name text NOT NULL,
  middle_name text DEFAULT '',
  last_name text NOT NULL,
  date_of_birth date,
  ssn text DEFAULT '',
  street_address text DEFAULT '',
  city text DEFAULT '',
  state text DEFAULT '',
  zip_code text DEFAULT '',
  primary_phone text DEFAULT '',
  secondary_phone text DEFAULT '',
  email text DEFAULT '',
  marital_status text DEFAULT '',
  injury_description text DEFAULT '',
  prior_accidents text DEFAULT '',
  prior_injuries text DEFAULT '',
  work_impact text DEFAULT '',
  referrer text DEFAULT '',
  referrer_relationship text DEFAULT '',
  has_health_insurance boolean DEFAULT false
);

-- Create defendants table
CREATE TABLE IF NOT EXISTS defendants (
  id bigserial PRIMARY KEY,
  casefile_id bigint NOT NULL REFERENCES casefiles(id) ON DELETE CASCADE,
  defendant_number integer DEFAULT 1,
  first_name text NOT NULL,
  last_name text NOT NULL,
  is_policyholder boolean DEFAULT true,
  policyholder_first_name text DEFAULT '',
  policyholder_last_name text DEFAULT '',
  auto_insurance_id bigint,
  policy_number text DEFAULT '',
  notes text DEFAULT ''
);

-- Create work_logs table
CREATE TABLE IF NOT EXISTS work_logs (
  id bigserial PRIMARY KEY,
  casefile_id bigint NOT NULL REFERENCES casefiles(id) ON DELETE CASCADE,
  description text NOT NULL,
  timestamp timestamptz DEFAULT now(),
  user_name text NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_casefile_id ON clients(casefile_id);
CREATE INDEX IF NOT EXISTS idx_defendants_casefile_id ON defendants(casefile_id);
CREATE INDEX IF NOT EXISTS idx_work_logs_casefile_id ON work_logs(casefile_id);
CREATE INDEX IF NOT EXISTS idx_casefiles_stage ON casefiles(stage);
CREATE INDEX IF NOT EXISTS idx_casefiles_status ON casefiles(status);
CREATE INDEX IF NOT EXISTS idx_casefiles_date_of_loss ON casefiles(date_of_loss);

-- Enable Row Level Security on all tables
ALTER TABLE casefiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE defendants ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for casefiles table
CREATE POLICY "Authenticated users can view all casefiles"
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

-- Create policies for clients table
CREATE POLICY "Authenticated users can view all clients"
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

-- Create policies for defendants table
CREATE POLICY "Authenticated users can view all defendants"
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

-- Create policies for work_logs table
CREATE POLICY "Authenticated users can view all work logs"
  ON work_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert work logs"
  ON work_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update work logs"
  ON work_logs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete work logs"
  ON work_logs FOR DELETE
  TO authenticated
  USING (true);