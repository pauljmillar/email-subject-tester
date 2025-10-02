-- RAG System Database Schema
-- This script creates the necessary tables and functions for the RAG (Retrieval-Augmented Generation) system

-- Step 1: Create embeddings table to store vector embeddings for subject lines
CREATE TABLE IF NOT EXISTS subject_line_embeddings (
  id SERIAL PRIMARY KEY,
  subject_line_id INTEGER NOT NULL REFERENCES subject_lines(id) ON DELETE CASCADE,
  embedding VECTOR(1536), -- OpenAI text-embedding-ada-002 produces 1536-dimensional vectors
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Create index for vector similarity search using pgvector
-- This enables fast similarity search using cosine similarity
CREATE INDEX IF NOT EXISTS idx_subject_line_embeddings_vector 
ON subject_line_embeddings USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Step 3: Create function to find similar subject lines using vector similarity
CREATE OR REPLACE FUNCTION find_similar_subject_lines(
  query_embedding VECTOR(1536),
  similarity_threshold FLOAT DEFAULT 0.7,
  max_results INTEGER DEFAULT 5
)
RETURNS TABLE (
  subject_line_id INTEGER,
  subject_line TEXT,
  open_rate DECIMAL(5,4),
  similarity_score FLOAT,
  company TEXT,
  sub_industry TEXT,
  mailing_type TEXT,
  read_rate DECIMAL(5,4),
  inbox_rate DECIMAL(5,4),
  date_sent DATE,
  spam_rate DECIMAL(5,4)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.id as subject_line_id,
    sl.subject_line,
    sl.open_rate,
    1 - (sle.embedding <=> query_embedding) as similarity_score,
    sl.company,
    sl.sub_industry,
    sl.mailing_type,
    sl.read_rate,
    sl.inbox_rate,
    sl.date_sent,
    sl.spam_rate
  FROM subject_line_embeddings sle
  JOIN subject_lines sl ON sle.subject_line_id = sl.id
  WHERE 1 - (sle.embedding <=> query_embedding) >= similarity_threshold
  ORDER BY sl.open_rate DESC, sle.embedding <=> query_embedding
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create function to get top-performing subject lines for context
CREATE OR REPLACE FUNCTION get_top_performing_subject_lines(
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  subject_line_id INTEGER,
  subject_line TEXT,
  open_rate DECIMAL(5,4),
  company TEXT,
  sub_industry TEXT,
  mailing_type TEXT,
  read_rate DECIMAL(5,4),
  inbox_rate DECIMAL(5,4)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.id as subject_line_id,
    sl.subject_line,
    sl.open_rate,
    sl.company,
    sl.sub_industry,
    sl.mailing_type,
    sl.read_rate,
    sl.inbox_rate
  FROM subject_lines sl
  ORDER BY sl.open_rate DESC, sl.read_rate DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create function to get subject lines by industry/company for context
CREATE OR REPLACE FUNCTION get_subject_lines_by_context(
  target_company TEXT DEFAULT NULL,
  target_industry TEXT DEFAULT NULL,
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  subject_line_id INTEGER,
  subject_line TEXT,
  open_rate DECIMAL(5,4),
  company TEXT,
  sub_industry TEXT,
  mailing_type TEXT,
  read_rate DECIMAL(5,4),
  inbox_rate DECIMAL(5,4)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.id as subject_line_id,
    sl.subject_line,
    sl.open_rate,
    sl.company,
    sl.sub_industry,
    sl.mailing_type,
    sl.read_rate,
    sl.inbox_rate
  FROM subject_lines sl
  WHERE 
    (target_company IS NULL OR sl.company ILIKE '%' || target_company || '%')
    AND (target_industry IS NULL OR sl.sub_industry ILIKE '%' || target_industry || '%')
  ORDER BY sl.open_rate DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Enable the pgvector extension (if not already enabled)
-- Note: This may need to be run by a database administrator
-- CREATE EXTENSION IF NOT EXISTS vector;
