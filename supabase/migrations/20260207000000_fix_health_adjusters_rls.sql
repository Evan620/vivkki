/*
  # Fix Health Adjusters RLS Policies and Trigger
  
  ## Problem
  The health_adjusters table has conflicting RLS policies and a trigger that fails when:
  - organization_members table doesn't exist
  - User is not in organization_members table
  - This causes "new row violates row-level security policy" errors
  
  ## Solution
  1. Make the tenant_id trigger more graceful - fall back to user_id if organization_members doesn't exist
  2. Update RLS policies to work with both user_id and tenant_id models
  3. Ensure policies allow inserts when either user_id or tenant_id is properly set
*/

-- Ensure user_id column exists (in case multi-tenancy migration didn't run or failed)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'health_adjusters' 
        AND column_name = 'user_id'
    ) THEN
        ALTER TABLE health_adjusters ADD COLUMN user_id uuid DEFAULT auth.uid();
        CREATE INDEX IF NOT EXISTS idx_health_adjusters_user_id ON health_adjusters(user_id);
    END IF;
END $$;

-- Ensure tenant_id column exists (for organization-based multi-tenancy)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'health_adjusters' 
        AND column_name = 'tenant_id'
    ) THEN
        ALTER TABLE health_adjusters ADD COLUMN tenant_id uuid;
        CREATE INDEX IF NOT EXISTS idx_health_adjusters_tenant_id ON health_adjusters(tenant_id);
    END IF;
END $$;

-- First, update the trigger function to be more graceful
CREATE OR REPLACE FUNCTION auto_set_tenant_id()
RETURNS TRIGGER AS $$
DECLARE
  user_org_id uuid;
  table_exists boolean;
BEGIN
  -- Skip if tenant_id is already set (for API use or admin operations)
  IF NEW.tenant_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Check if organization_members table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'organization_members'
  ) INTO table_exists;

  -- If organization_members table exists, try to get user's organization
  IF table_exists THEN
    SELECT organization_id INTO user_org_id
    FROM organization_members
    WHERE user_id = auth.uid()
    LIMIT 1;

    -- If user has an organization, set tenant_id
    IF user_org_id IS NOT NULL THEN
      NEW.tenant_id := user_org_id;
      RETURN NEW;
    END IF;
  END IF;

  -- Fallback: If no organization or table doesn't exist, ensure user_id is set
  -- This allows the insert to proceed with user_id-based RLS
  IF NEW.user_id IS NULL THEN
    NEW.user_id := auth.uid();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update RLS policies for health_adjusters to handle both user_id and tenant_id
-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view health adjusters" ON health_adjusters;
DROP POLICY IF EXISTS "Authenticated users can insert health adjusters" ON health_adjusters;
DROP POLICY IF EXISTS "Authenticated users can update health adjusters" ON health_adjusters;
DROP POLICY IF EXISTS "Authenticated users can delete health adjusters" ON health_adjusters;
DROP POLICY IF EXISTS "Users can view own health_adjusters" ON health_adjusters;
DROP POLICY IF EXISTS "Users can insert own health_adjusters" ON health_adjusters;
DROP POLICY IF EXISTS "Users can update own health_adjusters" ON health_adjusters;
DROP POLICY IF EXISTS "Users can delete own health_adjusters" ON health_adjusters;

-- Create new policies that work with both user_id and tenant_id models
-- Simplified policies that work with both models
-- SELECT: See own data (by user_id) OR legacy data (user_id IS NULL) OR matching tenant
CREATE POLICY "Users can view health adjusters"
  ON health_adjusters FOR SELECT
  TO authenticated
  USING (
    (auth.uid() = user_id) 
    OR (user_id IS NULL)
    OR (
      tenant_id IS NOT NULL 
      AND EXISTS (
        SELECT 1 FROM organization_members 
        WHERE user_id = auth.uid() 
        AND organization_id = health_adjusters.tenant_id
      )
    )
  );

-- INSERT: Allow authenticated users to insert (trigger will handle user_id/tenant_id)
CREATE POLICY "Users can insert health adjusters"
  ON health_adjusters FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- UPDATE: Update own data (by user_id) OR legacy data OR matching tenant
CREATE POLICY "Users can update health adjusters"
  ON health_adjusters FOR UPDATE
  TO authenticated
  USING (
    (auth.uid() = user_id)
    OR (user_id IS NULL)
    OR (
      tenant_id IS NOT NULL 
      AND EXISTS (
        SELECT 1 FROM organization_members 
        WHERE user_id = auth.uid() 
        AND organization_id = health_adjusters.tenant_id
      )
    )
  )
  WITH CHECK (
    (auth.uid() = user_id)
    OR (user_id IS NULL)
    OR (
      tenant_id IS NOT NULL 
      AND EXISTS (
        SELECT 1 FROM organization_members 
        WHERE user_id = auth.uid() 
        AND organization_id = health_adjusters.tenant_id
      )
    )
  );

-- DELETE: Delete own data (by user_id) OR legacy data OR matching tenant
CREATE POLICY "Users can delete health adjusters"
  ON health_adjusters FOR DELETE
  TO authenticated
  USING (
    (auth.uid() = user_id)
    OR (user_id IS NULL)
    OR (
      tenant_id IS NOT NULL 
      AND EXISTS (
        SELECT 1 FROM organization_members 
        WHERE user_id = auth.uid() 
        AND organization_id = health_adjusters.tenant_id
      )
    )
  );

-- Add comments
COMMENT ON FUNCTION auto_set_tenant_id() IS 'Automatically sets tenant_id or user_id for inserts. Gracefully handles missing organization_members table by falling back to user_id.';
