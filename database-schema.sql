-- Create the subject_lines table
CREATE TABLE IF NOT EXISTS subject_lines (
  id SERIAL PRIMARY KEY,
  subject_line TEXT NOT NULL,
  open_rate DECIMAL(5,4) NOT NULL, -- Store as decimal (0.0000 to 1.0000)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for faster text search
CREATE INDEX IF NOT EXISTS idx_subject_line_text ON subject_lines USING gin(to_tsvector('english', subject_line));

-- Simplified but effective search function
CREATE OR REPLACE FUNCTION search_subject_lines(query TEXT)
RETURNS TABLE (
  subject_line TEXT,
  open_rate DECIMAL(5,4),
  similarity REAL,
  score REAL
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
    (0.8 * similarity(sl.subject_line, query) + 0.2 * sl.open_rate)::REAL as score
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
      (0.7 * similarity(sl.subject_line, singular_query) + 0.3 * sl.open_rate)::REAL as score
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
      (0.7 * similarity(sl.subject_line, plural_query) + 0.3 * sl.open_rate)::REAL as score
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
    (0.5 * similarity(sl.subject_line, query) + 0.5 * sl.open_rate)::REAL as score
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
      (0.3 * similarity(sl.subject_line, query) + 0.7 * sl.open_rate)::REAL as score
    FROM subject_lines sl
    ORDER BY sl.open_rate DESC
    LIMIT 3;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Enable the pg_trgm extension for similarity function
CREATE EXTENSION IF NOT EXISTS pg_trgm;

