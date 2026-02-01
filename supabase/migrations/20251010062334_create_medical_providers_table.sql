/*
  # Create medical_providers table and seed data
  
  1. New Tables
    - `medical_providers`
      - `id` (bigint, primary key, auto-increment)
      - `name` (text, provider name)
      - `type` (text, provider type/specialty)
      - `city` (text, location city)
      - `request_method` (text, Email or Fax)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on `medical_providers` table
    - Add public read policy for viewing providers
  
  3. Data
    - Seed with 25 Oklahoma medical providers
*/

CREATE TABLE IF NOT EXISTS medical_providers (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  type text NOT NULL,
  city text NOT NULL,
  request_method text NOT NULL DEFAULT 'Email',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE medical_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public users can view medical providers"
  ON medical_providers FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can view medical providers"
  ON medical_providers FOR SELECT
  TO authenticated
  USING (true);

-- Seed medical providers data
INSERT INTO medical_providers (name, type, city, request_method) VALUES
  -- Hospitals
  ('Integris Baptist Medical Center', 'Hospital', 'Oklahoma City', 'Email'),
  ('St. Anthony Hospital', 'Hospital', 'Oklahoma City', 'Fax'),
  ('Mercy Hospital', 'Hospital', 'Oklahoma City', 'Email'),
  ('OU Medical Center', 'Hospital', 'Oklahoma City', 'Email'),
  ('Norman Regional Hospital', 'Hospital', 'Norman', 'Email'),
  ('Hillcrest Medical Center', 'Hospital', 'Tulsa', 'Fax'),
  ('St. Francis Hospital', 'Hospital', 'Tulsa', 'Email'),
  
  -- Chiropractic
  ('Hughes Chiropractic', 'Chiropractic', 'Edmond', 'Email'),
  ('Hooper Chiropractic', 'Chiropractic', 'Oklahoma City', 'Email'),
  ('Cole Chiropractic', 'Chiropractic', 'Norman', 'Fax'),
  ('Advanced Spine & Injury', 'Chiropractic', 'Tulsa', 'Email'),
  
  -- Pain Management
  ('Oklahoma Pain & Wellness Center', 'Pain Management', 'Oklahoma City', 'Email'),
  ('Pain Management Centers of America', 'Pain Management', 'Tulsa', 'Fax'),
  ('Comprehensive Pain Management', 'Pain Management', 'Norman', 'Email'),
  
  -- Radiology/Imaging
  ('Oklahoma Diagnostic Imaging', 'Radiology', 'Oklahoma City', 'Email'),
  ('Advanced Diagnostic Imaging', 'Radiology', 'Tulsa', 'Email'),
  
  -- Physical Therapy
  ('PT Works', 'Physical Therapy', 'Oklahoma City', 'Email'),
  ('Restore Physical Therapy', 'Physical Therapy', 'Edmond', 'Email'),
  
  -- Emergency/Urgent Care
  ('Emergency Physicians of Mid-America', 'Emergency', 'Oklahoma City', 'Email'),
  ('Comanche County Memorial Hospital', 'Hospital', 'Lawton', 'Fax'),
  
  -- Other
  ('Surgery Center of Oklahoma', 'Surgery Center', 'Oklahoma City', 'Email'),
  ('Orthopedic Associates', 'Orthopedic', 'Tulsa', 'Email'),
  ('Neurology Clinic', 'Neurology', 'Oklahoma City', 'Email'),
  ('Southwest Medical Center', 'Medical Center', 'Oklahoma City', 'Fax'),
  ('Urgent Care Clinic', 'Urgent Care', 'Norman', 'Email');
