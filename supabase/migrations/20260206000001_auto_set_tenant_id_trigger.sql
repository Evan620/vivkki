/*
  # Auto-Set tenant_id Trigger for Multi-Tenant Tables

  ## Overview
  Creates a trigger function that automatically sets tenant_id for authenticated users.
  When a user inserts data, the trigger finds their organization and assigns the tenant_id.

  ## How It Works
  - Trigger fires BEFORE INSERT on each table with tenant_id
  - Uses the authenticated user's ID (auth.uid()) to find their organization
  - Automatically sets tenant_id to the user's organization ID
  - If user has multiple organizations, uses the first one (default tenant)
  - If user has no organization, raises an error

  ## Tables Updated
  All tables with tenant_id column that are created by authenticated users:
  - casefiles, clients, defendants, work_logs
  - medical_providers, medical_bills, medical_provider_adjusters
  - auto_adjusters, health_adjusters
  - first_party_claims, third_party_claims, health_claims
  - documents, generated_documents
  - settlements, settlement_offers, general_damages, mileage_log
  - case_notes
*/

-- Create trigger function to auto-set tenant_id
CREATE OR REPLACE FUNCTION auto_set_tenant_id()
RETURNS TRIGGER AS $$
DECLARE
  user_org_id uuid;
BEGIN
  -- Skip if tenant_id is already set (for API use or admin operations)
  IF NEW.tenant_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Get the user's organization ID
  -- If user has multiple organizations, use the first one (can be enhanced for tenant selection)
  SELECT organization_id INTO user_org_id
  FROM organization_members
  WHERE user_id = auth.uid()
  LIMIT 1;

  -- If user has no organization, raise an error
  IF user_org_id IS NULL THEN
    RAISE EXCEPTION 'User must belong to an organization to create data';
  END IF;

  -- Set the tenant_id
  NEW.tenant_id := user_org_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINer;

-- Apply trigger to all tables with tenant_id
-- Casefiles
DROP TRIGGER IF EXISTS trigger_auto_set_tenant_id_casefiles ON casefiles;
CREATE TRIGGER trigger_auto_set_tenant_id_casefiles
  BEFORE INSERT ON casefiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();

-- Clients
DROP TRIGGER IF EXISTS trigger_auto_set_tenant_id_clients ON clients;
CREATE TRIGGER trigger_auto_set_tenant_id_clients
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();

-- Defendants
DROP TRIGGER IF EXISTS trigger_auto_set_tenant_id_defendants ON defendants;
CREATE TRIGGER trigger_auto_set_tenant_id_defendants
  BEFORE INSERT ON defendants
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();

-- Work logs
DROP TRIGGER IF EXISTS trigger_auto_set_tenant_id_work_logs ON work_logs;
CREATE TRIGGER trigger_auto_set_tenant_id_work_logs
  BEFORE INSERT ON work_logs
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();

-- Medical providers
DROP TRIGGER IF EXISTS trigger_auto_set_tenant_id_medical_providers ON medical_providers;
CREATE TRIGGER trigger_auto_set_tenant_id_medical_providers
  BEFORE INSERT ON medical_providers
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();

-- Medical bills
DROP TRIGGER IF EXISTS trigger_auto_set_tenant_id_medical_bills ON medical_bills;
CREATE TRIGGER trigger_auto_set_tenant_id_medical_bills
  BEFORE INSERT ON medical_bills
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();

-- Medical provider adjusters
DROP TRIGGER IF EXISTS trigger_auto_set_tenant_id_medical_provider_adjusters ON medical_provider_adjusters;
CREATE TRIGGER trigger_auto_set_tenant_id_medical_provider_adjusters
  BEFORE INSERT ON medical_provider_adjusters
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();

-- Auto adjusters
DROP TRIGGER IF EXISTS trigger_auto_set_tenant_id_auto_adjusters ON auto_adjusters;
CREATE TRIGGER trigger_auto_set_tenant_id_auto_adjusters
  BEFORE INSERT ON auto_adjusters
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();

-- Health adjusters
DROP TRIGGER IF EXISTS trigger_auto_set_tenant_id_health_adjusters ON health_adjusters;
CREATE TRIGGER trigger_auto_set_tenant_id_health_adjusters
  BEFORE INSERT ON health_adjusters
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();

-- First party claims
DROP TRIGGER IF EXISTS trigger_auto_set_tenant_id_first_party_claims ON first_party_claims;
CREATE TRIGGER trigger_auto_set_tenant_id_first_party_claims
  BEFORE INSERT ON first_party_claims
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();

-- Third party claims
DROP TRIGGER IF EXISTS trigger_auto_set_tenant_id_third_party_claims ON third_party_claims;
CREATE TRIGGER trigger_auto_set_tenant_id_third_party_claims
  BEFORE INSERT ON third_party_claims
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();

-- Health claims
DROP TRIGGER IF EXISTS trigger_auto_set_tenant_id_health_claims ON health_claims;
CREATE TRIGGER trigger_auto_set_tenant_id_health_claims
  BEFORE INSERT ON health_claims
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();

-- Documents
DROP TRIGGER IF EXISTS trigger_auto_set_tenant_id_documents ON documents;
CREATE TRIGGER trigger_auto_set_tenant_id_documents
  BEFORE INSERT ON documents
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();

-- Generated documents
DROP TRIGGER IF EXISTS trigger_auto_set_tenant_id_generated_documents ON generated_documents;
CREATE TRIGGER trigger_auto_set_tenant_id_generated_documents
  BEFORE INSERT ON generated_documents
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();

-- Settlements
DROP TRIGGER IF EXISTS trigger_auto_set_tenant_id_settlements ON settlements;
CREATE TRIGGER trigger_auto_set_tenant_id_settlements
  BEFORE INSERT ON settlements
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();

-- Settlement offers
DROP TRIGGER IF EXISTS trigger_auto_set_tenant_id_settlement_offers ON settlement_offers;
CREATE TRIGGER trigger_auto_set_tenant_id_settlement_offers
  BEFORE INSERT ON settlement_offers
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();

-- General damages
DROP TRIGGER IF EXISTS trigger_auto_set_tenant_id_general_damages ON general_damages;
CREATE TRIGGER trigger_auto_set_tenant_id_general_damages
  BEFORE INSERT ON general_damages
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();

-- Mileage log
DROP TRIGGER IF EXISTS trigger_auto_set_tenant_id_mileage_log ON mileage_log;
CREATE TRIGGER trigger_auto_set_tenant_id_mileage_log
  BEFORE INSERT ON mileage_log
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();

-- Case notes
DROP TRIGGER IF EXISTS trigger_auto_set_tenant_id_case_notes ON case_notes;
CREATE TRIGGER trigger_auto_set_tenant_id_case_notes
  BEFORE INSERT ON case_notes
  FOR EACH ROW
  EXECUTE FUNCTION auto_set_tenant_id();

-- Add comments for documentation
COMMENT ON FUNCTION auto_set_tenant_id() IS 'Automatically sets tenant_id for inserts based on the authenticated user''s organization membership. Skips if tenant_id is already set (for API/admin use).';
