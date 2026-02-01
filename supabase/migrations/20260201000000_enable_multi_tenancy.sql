/*
  # Enable Multi-Tenancy (User Isolation) - Safe Mode

  This migration updates tables to support multi-tenancy by associating records with a `user_id`.
  
  SAFETY UPDATE:
  - Existing data will have `user_id` as NULL.
  - Policies now include `OR user_id IS NULL` to ensure existing data DOES NOT DISAPPEAR.
  - This means legacy data is visible to ALL authenticated users until you run a backfill.
  - New data will naturally be private to the creator.

  ## Changes
  1. Add `user_id` column (Nullable, Default `auth.uid()`).
  2. Update RLS Policies to allow access if:
     - The record belongs to the user (`user_id = auth.uid()`)
     - OR the record has no owner (`user_id IS NULL`) - aka Legacy Data

*/

DO $$ 
DECLARE
    t text;
    tables text[] := ARRAY[
        'casefiles', 
        'clients', 
        'defendants', 
        'work_logs', 
        'medical_providers', 
        'medical_bills', 
        'auto_insurance', 
        'health_insurance', 
        'health_claims', 
        'first_party_claims', 
        'third_party_claims', 
        'documents',
        'settlements',
        'general_damages',
        'case_notes',
        'medical_provider_adjusters',
        'auto_adjusters',
        'health_adjusters'
    ];
BEGIN
    FOREACH t IN ARRAY tables
    LOOP
        -- Check if table exists to avoid errors
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = t) THEN
            
            -- 1. Add user_id column if it doesn't exist
            IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = t AND column_name = 'user_id') THEN
                EXECUTE format('ALTER TABLE %I ADD COLUMN user_id uuid DEFAULT auth.uid()', t);
                EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_user_id ON %I(user_id)', t, t);
            END IF;

            -- 2. Drop existing policies
            EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can view %I" ON %I', t, t);
            EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can insert %I" ON %I', t, t);
            EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can update %I" ON %I', t, t);
            EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can delete %I" ON %I', t, t);
            
            -- Catch generic ones
            EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can view all %I" ON %I', t, t);
            EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can view all casefiles" ON %I', t); 

            -- 3. Create New Policies (Safe Hybrid Mode)
            
            -- SELECT: See own data OR legacy data
            EXECUTE format('CREATE POLICY "Users can view own %I" ON %I FOR SELECT TO authenticated USING ((auth.uid() = user_id) OR (user_id IS NULL))', t, t);

            -- INSERT: New data must be owned
            EXECUTE format('CREATE POLICY "Users can insert own %I" ON %I FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)', t, t);

            -- UPDATE: Update own data OR legacy data (taking ownership logic could happen here, but simplest is allow update)
            EXECUTE format('CREATE POLICY "Users can update own %I" ON %I FOR UPDATE TO authenticated USING ((auth.uid() = user_id) OR (user_id IS NULL)) WITH CHECK ((auth.uid() = user_id) OR (user_id IS NULL))', t, t);

            -- DELETE
            EXECUTE format('CREATE POLICY "Users can delete own %I" ON %I FOR DELETE TO authenticated USING ((auth.uid() = user_id) OR (user_id IS NULL))', t, t);

        END IF;
    END LOOP;
END $$;
