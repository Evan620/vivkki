/*
  # Create Documents Table

  1. New Tables
    - `documents`
      - `id` (bigint, primary key, auto-increment)
      - `casefile_id` (bigint, foreign key to casefiles)
      - `file_name` (text, the original file name)
      - `file_type` (text, MIME type)
      - `file_size` (integer, size in bytes)
      - `file_url` (text, Supabase Storage URL)
      - `category` (text, one of: Letter, Medical, Photo, Court, Other)
      - `uploaded_by` (text, default 'Admin')
      - `uploaded_at` (timestamptz, default now())
      - `notes` (text, nullable, for additional information)
      - `created_at` (timestamptz, default now())
      - `updated_at` (timestamptz, default now())

  2. Security
    - Enable RLS on `documents` table
    - Add policy for public users to view documents
    - Add policy for public users to insert documents
    - Add policy for public users to update documents
    - Add policy for public users to delete documents
    - Add policy for authenticated users with full access
*/

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  casefile_id bigint NOT NULL REFERENCES casefiles(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  file_url text NOT NULL,
  category text DEFAULT 'Other',
  uploaded_by text DEFAULT 'Admin',
  uploaded_at timestamptz DEFAULT now(),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Public policies for documents
CREATE POLICY "Public users can view documents"
  ON documents FOR SELECT TO anon USING (true);

CREATE POLICY "Public users can insert documents"
  ON documents FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Public users can update documents"
  ON documents FOR UPDATE TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Public users can delete documents"
  ON documents FOR DELETE TO anon USING (true);

-- Authenticated policies for documents
CREATE POLICY "Authenticated users can view documents"
  ON documents FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert documents"
  ON documents FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update documents"
  ON documents FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete documents"
  ON documents FOR DELETE TO authenticated USING (true);

-- Create index for faster queries by casefile_id
CREATE INDEX IF NOT EXISTS idx_documents_casefile_id ON documents(casefile_id);

-- Create index for faster queries by category
CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
