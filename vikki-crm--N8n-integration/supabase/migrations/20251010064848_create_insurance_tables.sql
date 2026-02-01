/*
  # Create insurance tables and seed data
  
  1. New Tables
    - `auto_insurance`
      - `id` (bigint, primary key, auto-increment)
      - `name` (text, company name)
      - `phone` (text, phone number)
      - `city` (text, location city)
      - `state` (text, location state)
      - `created_at` (timestamptz)
    
    - `health_insurance`
      - `id` (bigint, primary key, auto-increment)
      - `name` (text, company name)
      - `phone` (text, phone number)
      - `city` (text, location city)
      - `state` (text, location state)
      - `created_at` (timestamptz)
  
  2. Security
    - Enable RLS on both tables
    - Add public read policies for viewing insurance companies
  
  3. Data
    - Seed 20 auto insurance companies
    - Seed 15 health insurance companies
*/

CREATE TABLE IF NOT EXISTS auto_insurance (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  phone text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS health_insurance (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name text NOT NULL,
  phone text NOT NULL,
  city text NOT NULL,
  state text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE auto_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_insurance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public users can view auto insurance"
  ON auto_insurance FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can view auto insurance"
  ON auto_insurance FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public users can view health insurance"
  ON health_insurance FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Authenticated users can view health insurance"
  ON health_insurance FOR SELECT
  TO authenticated
  USING (true);

-- Seed auto insurance companies
INSERT INTO auto_insurance (name, phone, city, state) VALUES
  ('State Farm', '(800) 782-8332', 'Bloomington', 'IL'),
  ('Allstate', '(800) 255-7828', 'Northbrook', 'IL'),
  ('Geico', '(800) 861-8380', 'Chevy Chase', 'MD'),
  ('Progressive', '(800) 776-4737', 'Mayfield Village', 'OH'),
  ('Farm Bureau', '(800) 444-8222', 'Oklahoma City', 'OK'),
  ('USAA', '(800) 531-8722', 'San Antonio', 'TX'),
  ('Liberty Mutual', '(800) 290-5810', 'Boston', 'MA'),
  ('Farmers Insurance', '(800) 435-7764', 'Los Angeles', 'CA'),
  ('Nationwide', '(800) 421-3535', 'Columbus', 'OH'),
  ('American Family', '(800) 692-6326', 'Madison', 'WI'),
  ('Travelers', '(800) 252-4633', 'New York', 'NY'),
  ('The Hartford', '(800) 243-5860', 'Hartford', 'CT'),
  ('Mercury Insurance', '(800) 503-3724', 'Los Angeles', 'CA'),
  ('Erie Insurance', '(800) 458-0811', 'Erie', 'PA'),
  ('Auto-Owners Insurance', '(888) 252-4626', 'Lansing', 'MI'),
  ('Safeco', '(800) 332-3226', 'Seattle', 'WA'),
  ('AAA Insurance', '(800) 222-4357', 'Heathrow', 'FL'),
  ('MetLife', '(800) 854-6011', 'New York', 'NY'),
  ('Esurance', '(800) 378-7262', 'San Francisco', 'CA'),
  ('The General', '(800) 280-1466', 'Nashville', 'TN');

-- Seed health insurance companies
INSERT INTO health_insurance (name, phone, city, state) VALUES
  ('Blue Cross Blue Shield', '(800) 654-7156', 'Oklahoma City', 'OK'),
  ('UnitedHealthcare', '(800) 328-5979', 'Minnetonka', 'MN'),
  ('Aetna', '(800) 872-3862', 'Hartford', 'CT'),
  ('Cigna', '(800) 997-1654', 'Bloomfield', 'CT'),
  ('Humana', '(800) 448-6262', 'Louisville', 'KY'),
  ('Kaiser Permanente', '(800) 464-4000', 'Oakland', 'CA'),
  ('Anthem', '(844) 503-4210', 'Indianapolis', 'IN'),
  ('Centene', '(800) 945-8508', 'St. Louis', 'MO'),
  ('WellCare', '(866) 530-9491', 'Tampa', 'FL'),
  ('Molina Healthcare', '(888) 665-4621', 'Long Beach', 'CA'),
  ('Oscar Health', '(855) 672-2788', 'New York', 'NY'),
  ('Bright Health', '(833) 276-2642', 'Minneapolis', 'MN'),
  ('Medicare', '(800) 633-4227', 'Baltimore', 'MD'),
  ('Medicaid', '(800) 522-0310', 'Oklahoma City', 'OK'),
  ('GlobalHealth', '(800) 259-2178', 'Oklahoma City', 'OK');
