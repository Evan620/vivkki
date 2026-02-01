/*
  # Add Storage Path to Documents

  1. Changes
    - Add storage_path column to documents table
    - This stores the full Supabase Storage path for proper file deletion
    - Example: "case-123/1734134521000-file.pdf"

  2. Notes
    - Required for proper file deletion from Supabase Storage
    - No RLS changes needed (existing policies cover new column)
*/

-- Add storage_path column
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS storage_path text;
