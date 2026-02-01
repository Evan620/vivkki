/*
  # Add Medical Bill Financial Tracking
  
  ## Overview
  Adds comprehensive financial tracking to medical bills including amounts billed,
  payments received, adjustments, and calculated balance due.
  
  ## Changes
  
  ### New Columns
  - `amount_billed` (decimal) - Total amount billed by provider
  - `insurance_paid` (decimal) - Amount paid by health insurance
  - `insurance_adjusted` (decimal) - Insurance adjustment/write-off
  - `medpay_paid` (decimal) - Amount paid by MedPay coverage
  - `patient_paid` (decimal) - Amount paid by patient/client
  - `reduction_amount` (decimal) - Provider reduction/negotiated discount
  - `pi_expense` (decimal) - Personal injury attorney expense
  - `balance_due` (decimal) - Computed: remaining balance after all payments/adjustments
  
  ### Computed Column
  - `balance_due` automatically calculates: billed - all payments - all adjustments
  
  ## Notes
  - All financial columns default to 0
  - balance_due uses COALESCE to handle NULL values
  - Supports comprehensive medical bill tracking
*/

-- Add financial tracking columns to medical_bills table
ALTER TABLE medical_bills
ADD COLUMN IF NOT EXISTS amount_billed decimal(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS insurance_paid decimal(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS insurance_adjusted decimal(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS medpay_paid decimal(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS patient_paid decimal(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS reduction_amount decimal(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS pi_expense decimal(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS balance_due decimal(10,2) GENERATED ALWAYS AS (
  amount_billed 
  - COALESCE(insurance_paid, 0) 
  - COALESCE(insurance_adjusted, 0) 
  - COALESCE(medpay_paid, 0) 
  - COALESCE(patient_paid, 0) 
  - COALESCE(reduction_amount, 0)
) STORED;

-- Add constraints to ensure non-negative amounts
ALTER TABLE medical_bills 
ADD CONSTRAINT amount_billed_non_negative CHECK (amount_billed >= 0),
ADD CONSTRAINT insurance_paid_non_negative CHECK (insurance_paid >= 0),
ADD CONSTRAINT insurance_adjusted_non_negative CHECK (insurance_adjusted >= 0),
ADD CONSTRAINT medpay_paid_non_negative CHECK (medpay_paid >= 0),
ADD CONSTRAINT patient_paid_non_negative CHECK (patient_paid >= 0),
ADD CONSTRAINT reduction_amount_non_negative CHECK (reduction_amount >= 0),
ADD CONSTRAINT pi_expense_non_negative CHECK (pi_expense >= 0);

-- Add comments for documentation
COMMENT ON COLUMN medical_bills.amount_billed IS 'Total amount billed by medical provider';
COMMENT ON COLUMN medical_bills.insurance_paid IS 'Amount paid by health insurance';
COMMENT ON COLUMN medical_bills.insurance_adjusted IS 'Insurance adjustment/write-off amount';
COMMENT ON COLUMN medical_bills.medpay_paid IS 'Amount paid by MedPay coverage';
COMMENT ON COLUMN medical_bills.patient_paid IS 'Amount paid by patient/client';
COMMENT ON COLUMN medical_bills.reduction_amount IS 'Provider reduction/negotiated discount';
COMMENT ON COLUMN medical_bills.pi_expense IS 'Personal injury attorney expense';
COMMENT ON COLUMN medical_bills.balance_due IS 'Computed: remaining balance after all payments and adjustments';

-- Create indexes for financial queries
CREATE INDEX IF NOT EXISTS idx_medical_bills_amount_billed ON medical_bills(amount_billed);
CREATE INDEX IF NOT EXISTS idx_medical_bills_balance_due ON medical_bills(balance_due);
