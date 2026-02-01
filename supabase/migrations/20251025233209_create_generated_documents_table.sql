/*
  # Create Generated Documents Table
  
  ## Overview
  Creates a comprehensive table to track all generated documents (PDFs, letters, etc.)
  with metadata, file storage information, and generation history.
  
  ## New Table: generated_documents
  
  ### Columns
  - `id` (bigserial, primary key) - Unique document identifier
  - `casefile_id` (bigint, foreign key) - Reference to parent case
  - `document_type` (text) - Type of document (LOR, HIPAA, Demand, etc.)
  - `document_name` (text) - Human-readable document name
  - `file_path` (text) - Path to stored file
  - `file_url` (text) - Public URL for file access
  - `generated_by` (text) - User who generated the document
  - `generated_at` (timestamptz) - When document was created
  - `metadata` (jsonb) - Additional document metadata
  
  ### Security
  - Row Level Security enabled
  - Policy for authenticated users to manage documents
  
  ### Indexes
  - Index on casefile_id for case-based queries
  - Index on document_type for type-based filtering
  - Index on generated_at for chronological queries
  
  ## Notes
  - Supports all document types from the template system
  - Metadata field allows flexible document properties
  - Tracks generation history for audit purposes
*/

-- Create generated_documents table
CREATE TABLE IF NOT EXISTS generated_documents (
  id bigserial PRIMARY KEY,
  casefile_id bigint NOT NULL REFERENCES casefiles(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_name text NOT NULL,
  file_path text NOT NULL,
  file_url text,
  generated_by text,
  generated_at timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_generated_docs_case ON generated_documents(casefile_id);
CREATE INDEX IF NOT EXISTS idx_generated_docs_type ON generated_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_generated_docs_date ON generated_documents(generated_at);
CREATE INDEX IF NOT EXISTS idx_generated_docs_metadata ON generated_documents USING GIN(metadata);

-- Enable Row Level Security
ALTER TABLE generated_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Authenticated users can view generated documents"
  ON generated_documents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert generated documents"
  ON generated_documents FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update generated documents"
  ON generated_documents FOR UPDATE
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete generated documents"
  ON generated_documents FOR DELETE
  TO authenticated
  USING (true);

-- Add comments for documentation
COMMENT ON TABLE generated_documents IS 'Tracks all generated documents with metadata and file information';
COMMENT ON COLUMN generated_documents.document_type IS 'Type of document (cotton_1st_party_lor, cotton_demand_rear_end, etc.)';
COMMENT ON COLUMN generated_documents.document_name IS 'Human-readable name for the document';
COMMENT ON COLUMN generated_documents.file_path IS 'Path to the stored file in storage bucket';
COMMENT ON COLUMN generated_documents.file_url IS 'Public URL for accessing the document';
COMMENT ON COLUMN generated_documents.generated_by IS 'User who generated the document';
COMMENT ON COLUMN generated_documents.metadata IS 'Additional document properties (template variables, etc.)';
