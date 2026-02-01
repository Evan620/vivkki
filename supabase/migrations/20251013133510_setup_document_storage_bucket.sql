/*
  # Setup Document Storage Bucket and Policies

  1. Storage Configuration
    - Creates 'case-documents' storage bucket if it doesn't exist
    - Sets bucket as public for easy file access
    - Configures file size limit to 10MB

  2. Storage Policies
    - Allows public read access to all files
    - Allows public upload of files
    - Allows public delete of files
    - Allows public update of files
    
  3. Notes
    - This migration uses direct INSERT to bypass RLS restrictions
    - Bucket is created as public to avoid auth complications
    - All operations are idempotent (safe to run multiple times)
*/

-- Insert bucket directly into storage.buckets table (bypasses RLS)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'case-documents',
  'case-documents',
  true,
  10485760,
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760;

-- Create policies for storage.objects to allow public access
-- These policies control what users can do with files in the bucket

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "Public can read case documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can upload case documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can delete case documents" ON storage.objects;
DROP POLICY IF EXISTS "Public can update case documents" ON storage.objects;

-- Allow anyone to read/view files in case-documents bucket
CREATE POLICY "Public can read case documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'case-documents');

-- Allow anyone to upload files to case-documents bucket
CREATE POLICY "Public can upload case documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'case-documents');

-- Allow anyone to delete files from case-documents bucket
CREATE POLICY "Public can delete case documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'case-documents');

-- Allow anyone to update files in case-documents bucket
CREATE POLICY "Public can update case documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'case-documents')
WITH CHECK (bucket_id = 'case-documents');
