/*
  # Clean Storage and Setup for Proper Creation

  1. Issue
    - Bucket was created via direct SQL INSERT
    - Not showing in Supabase Dashboard
    - Missing required internal metadata
    
  2. Solution
    - Delete any existing objects
    - Remove policies
    - Delete improperly created bucket
    - Bucket will be created properly via Supabase Storage API from client
    
  3. Next Steps
    - Client component will create bucket on first load
    - Uses Supabase JS client which handles all metadata correctly
    - Bucket will then appear in Dashboard
*/

-- Delete any existing objects in the bucket first
DELETE FROM storage.objects WHERE bucket_id = 'case-documents';

-- Drop all storage policies
DROP POLICY IF EXISTS "Public can delete case documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can read case documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can update case documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload case documents" ON storage.objects;

-- Delete the improperly created bucket
DELETE FROM storage.buckets WHERE id = 'case-documents';

-- Note: The client component will now create the bucket properly
-- using supabase.storage.createBucket() which creates all required metadata
