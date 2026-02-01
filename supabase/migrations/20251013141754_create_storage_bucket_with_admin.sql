/*
  # Create Storage Bucket with Admin Privileges

  1. Creates Bucket
    - Uses direct INSERT with all required fields
    - Sets bucket as public for file access
    - Configures 10MB file size limit
    - Adds proper metadata for Dashboard visibility
    
  2. Storage Policies
    - Allows public read access to files
    - Allows public upload of files
    - Allows public delete of files
    - Allows public update of files
    
  3. Security
    - All operations scoped to case-documents bucket
    - File size limit enforced at bucket level
    - Public access for ease of use without auth
*/

-- Insert bucket with all required fields for Dashboard visibility
INSERT INTO storage.buckets (
  id, 
  name, 
  public, 
  file_size_limit,
  allowed_mime_types,
  owner,
  created_at,
  updated_at
)
VALUES (
  'case-documents',
  'case-documents',
  true,
  10485760,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ]::text[],
  (SELECT id FROM auth.users LIMIT 1),
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ]::text[],
  updated_at = now();

-- Create storage policies for file operations
-- Drop existing if any
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Public upload access" ON storage.objects;
DROP POLICY IF EXISTS "Public delete access" ON storage.objects;
DROP POLICY IF EXISTS "Public update access" ON storage.objects;

-- Allow public to read files
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'case-documents');

-- Allow public to upload files
CREATE POLICY "Public upload access"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'case-documents');

-- Allow public to delete files
CREATE POLICY "Public delete access"
ON storage.objects FOR DELETE
USING (bucket_id = 'case-documents');

-- Allow public to update files
CREATE POLICY "Public update access"
ON storage.objects FOR UPDATE
USING (bucket_id = 'case-documents')
WITH CHECK (bucket_id = 'case-documents');
