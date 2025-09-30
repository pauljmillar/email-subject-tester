-- Create the subject_lines table with extended fields
CREATE TABLE IF NOT EXISTS subject_lines (
  id SERIAL PRIMARY KEY,
  subject_line TEXT NOT NULL,
  open_rate DECIMAL(5,4) NOT NULL, -- Store as decimal (0.0000 to 1.0000)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- New fields from the dataset
  date_sent DATE,
  company TEXT,
  sub_industry TEXT,
  mailing_type TEXT,
  inbox_rate DECIMAL(5,4),
  spam_rate DECIMAL(5,4),
  read_rate DECIMAL(5,4),
  read_delete_rate DECIMAL(5,4),
  delete_without_read_rate DECIMAL(5,4),
  projected_volume BIGINT
);

-- Create indexes for faster text search and filtering
CREATE INDEX IF NOT EXISTS idx_subject_line_text ON subject_lines USING gin(to_tsvector('english', subject_line));
CREATE INDEX IF NOT EXISTS idx_company ON subject_lines (company);
CREATE INDEX IF NOT EXISTS idx_sub_industry ON subject_lines (sub_industry);
CREATE INDEX IF NOT EXISTS idx_mailing_type ON subject_lines (mailing_type);
CREATE INDEX IF NOT EXISTS idx_open_rate ON subject_lines (open_rate DESC);
CREATE INDEX IF NOT EXISTS idx_read_rate ON subject_lines (read_rate DESC);
CREATE INDEX IF NOT EXISTS idx_date_sent ON subject_lines (date_sent DESC);

-- Enhanced search function with additional fields
CREATE OR REPLACE FUNCTION search_subject_lines(query TEXT)
RETURNS TABLE (
  subject_line TEXT,
  open_rate DECIMAL(5,4),
  similarity REAL,
  score REAL,
  company TEXT,
  sub_industry TEXT,
  mailing_type TEXT,
  read_rate DECIMAL(5,4),
  inbox_rate DECIMAL(5,4)
) AS $$
DECLARE
  singular_query TEXT;
  plural_query TEXT;
BEGIN
  -- Create singular and plural variants
  singular_query := regexp_replace(lower(trim(query)), 's$', '');
  plural_query := lower(trim(query)) || 's';
  
  -- Strategy 1: Exact phrase matching (highest priority)
  RETURN QUERY
  SELECT 
    sl.subject_line,
    sl.open_rate,
    similarity(sl.subject_line, query)::REAL as similarity,
    (0.8 * similarity(sl.subject_line, query) + 0.2 * sl.open_rate)::REAL as score,
    sl.company,
    sl.sub_industry,
    sl.mailing_type,
    sl.read_rate,
    sl.inbox_rate
  FROM subject_lines sl
  WHERE sl.subject_line ILIKE '%' || query || '%'
  ORDER BY score DESC
  LIMIT 5;
  
  -- Strategy 2: Try singular form if query ends with 's'
  IF query ~ 's$' THEN
    RETURN QUERY
    SELECT 
      sl.subject_line,
      sl.open_rate,
      similarity(sl.subject_line, singular_query)::REAL as similarity,
      (0.7 * similarity(sl.subject_line, singular_query) + 0.3 * sl.open_rate)::REAL as score,
      sl.company,
      sl.sub_industry,
      sl.mailing_type,
      sl.read_rate,
      sl.inbox_rate
    FROM subject_lines sl
    WHERE sl.subject_line ILIKE '%' || singular_query || '%'
    AND sl.subject_line NOT ILIKE '%' || query || '%'  -- Avoid duplicates
    ORDER BY score DESC
    LIMIT 5;
  END IF;
  
  -- Strategy 3: Try plural form if query doesn't end with 's'
  IF query !~ 's$' THEN
    RETURN QUERY
    SELECT 
      sl.subject_line,
      sl.open_rate,
      similarity(sl.subject_line, plural_query)::REAL as similarity,
      (0.7 * similarity(sl.subject_line, plural_query) + 0.3 * sl.open_rate)::REAL as score,
      sl.company,
      sl.sub_industry,
      sl.mailing_type,
      sl.read_rate,
      sl.inbox_rate
    FROM subject_lines sl
    WHERE sl.subject_line ILIKE '%' || plural_query || '%'
    AND sl.subject_line NOT ILIKE '%' || query || '%'  -- Avoid duplicates
    ORDER BY score DESC
    LIMIT 5;
  END IF;
  
  -- Strategy 4: Fuzzy matching with lower threshold
  RETURN QUERY
  SELECT 
    sl.subject_line,
    sl.open_rate,
    similarity(sl.subject_line, query)::REAL as similarity,
    (0.5 * similarity(sl.subject_line, query) + 0.5 * sl.open_rate)::REAL as score,
    sl.company,
    sl.sub_industry,
    sl.mailing_type,
    sl.read_rate,
    sl.inbox_rate
  FROM subject_lines sl
  WHERE similarity(sl.subject_line, query) > 0.1
  AND sl.subject_line NOT ILIKE '%' || query || '%'  -- Avoid duplicates
  ORDER BY score DESC
  LIMIT 5;
  
  -- Strategy 5: High open rate fallback
  IF (SELECT COUNT(*) FROM subject_lines sl WHERE sl.subject_line ILIKE '%' || query || '%') < 3 THEN
    RETURN QUERY
    SELECT 
      sl.subject_line,
      sl.open_rate,
      similarity(sl.subject_line, query)::REAL as similarity,
      (0.3 * similarity(sl.subject_line, query) + 0.7 * sl.open_rate)::REAL as score,
      sl.company,
      sl.sub_industry,
      sl.mailing_type,
      sl.read_rate,
      sl.inbox_rate
    FROM subject_lines sl
    ORDER BY sl.open_rate DESC
    LIMIT 3;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Enable the pg_trgm extension for similarity function
CREATE EXTENSION IF NOT EXISTS pg_trgm;

