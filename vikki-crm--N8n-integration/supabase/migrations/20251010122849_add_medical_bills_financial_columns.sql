/*
  # Add financial tracking columns to medical_bills table
  
  1. Problem
    - Medical bills table missing financial columns
    - Cannot track amounts billed, paid, adjusted
    - Cannot track last request date or notes
    - Edit Medical Bill modal cannot function without these fields
  
  2. New Columns
    - total_billed (numeric) - Total amount billed by provider
    - insurance_paid (numeric) - Amount paid by insurance
    - insurance_adjusted (numeric) - Amount adjusted by insurance
    - last_request_date (date) - Date of last follow-up request
    - notes (text) - Additional notes about the bill
  
  3. Security
    - No RLS changes needed (existing policies cover new columns)
*/

-- Add financial tracking columns to medical_bills
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_bills' AND column_name = 'total_billed'
  ) THEN
    ALTER TABLE medical_bills ADD COLUMN total_billed numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_bills' AND column_name = 'insurance_paid'
  ) THEN
    ALTER TABLE medical_bills ADD COLUMN insurance_paid numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_bills' AND column_name = 'insurance_adjusted'
  ) THEN
    ALTER TABLE medical_bills ADD COLUMN insurance_adjusted numeric(10,2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_bills' AND column_name = 'last_request_date'
  ) THEN
    ALTER TABLE medical_bills ADD COLUMN last_request_date date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'medical_bills' AND column_name = 'notes'
  ) THEN
    ALTER TABLE medical_bills ADD COLUMN notes text;
  END IF;
END $$;
