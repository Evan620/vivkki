/*
  # Add Third Party Claims Settlement Fields

  1. Changes
    - Add adjuster information fields (adjuster_name, adjuster_phone)
    - Add date tracking fields (lor_date, loa_date, last_request_date)
    - Add settlement tracking fields (demand_sent, demand_amount, demand_date)
    - Add offer tracking fields (offer_received, offer_amount, offer_date)
    - Add counter offer fields (counter_offer_sent, counter_amount)
    - Add settlement fields (settlement_reached, settlement_amount, settlement_date)
    - Add liability assessment fields (liability_percentage, policy_limits, liability_disputed)
    - Add notes field

  2. Security
    - No RLS changes needed (existing policies cover new columns)
*/

-- Add adjuster information
ALTER TABLE third_party_claims 
ADD COLUMN IF NOT EXISTS adjuster_name text,
ADD COLUMN IF NOT EXISTS adjuster_phone text;

-- Add date tracking
ALTER TABLE third_party_claims
ADD COLUMN IF NOT EXISTS lor_date date,
ADD COLUMN IF NOT EXISTS loa_date date,
ADD COLUMN IF NOT EXISTS last_request_date date;

-- Add settlement tracking
ALTER TABLE third_party_claims
ADD COLUMN IF NOT EXISTS demand_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS demand_amount numeric(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS demand_date date;

-- Add offer tracking
ALTER TABLE third_party_claims
ADD COLUMN IF NOT EXISTS offer_received boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS offer_amount numeric(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS offer_date date;

-- Add counter offer tracking
ALTER TABLE third_party_claims
ADD COLUMN IF NOT EXISTS counter_offer_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS counter_amount numeric(12, 2) DEFAULT 0;

-- Add settlement fields
ALTER TABLE third_party_claims
ADD COLUMN IF NOT EXISTS settlement_reached boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS settlement_amount numeric(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS settlement_date date;

-- Add liability assessment
ALTER TABLE third_party_claims
ADD COLUMN IF NOT EXISTS liability_percentage integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS policy_limits numeric(12, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS liability_disputed boolean DEFAULT false;

-- Add notes
ALTER TABLE third_party_claims
ADD COLUMN IF NOT EXISTS notes text;
