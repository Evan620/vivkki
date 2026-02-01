/*
  # Add user_id to api_keys and enforce per-user access

  - Adds user_id column referencing auth.users(id)
  - Indexes user_id for lookups
  - Updates RLS to scope all operations to the owning user
*/

-- Add user_id column
ALTER TABLE api_keys
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);

-- Index for faster per-user queries
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);

-- Enable RLS (already enabled previously, but ensure)
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Drop old policies if present
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'Allow read active API keys') THEN
    DROP POLICY "Allow read active API keys" ON api_keys;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'Allow insert API keys for authenticated users') THEN
    DROP POLICY "Allow insert API keys for authenticated users" ON api_keys;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'api_keys' AND policyname = 'Allow update API keys for authenticated users') THEN
    DROP POLICY "Allow update API keys for authenticated users" ON api_keys;
  END IF;
END$$;

-- Per-user policies
CREATE POLICY "api_keys_select_own"
ON api_keys FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "api_keys_insert_own"
ON api_keys FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "api_keys_update_own"
ON api_keys FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "api_keys_delete_own"
ON api_keys FOR DELETE
USING (user_id = auth.uid());

COMMENT ON COLUMN api_keys.user_id IS 'Owner of the API key (auth.users.id)';

