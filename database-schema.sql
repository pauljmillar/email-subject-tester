-- Create the subject_lines table
CREATE TABLE IF NOT EXISTS subject_lines (
  id SERIAL PRIMARY KEY,
  subject_line TEXT NOT NULL,
  open_rate DECIMAL(5,4) NOT NULL, -- Store as decimal (0.0000 to 1.0000)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for faster text search
CREATE INDEX IF NOT EXISTS idx_subject_line_text ON subject_lines USING gin(to_tsvector('english', subject_line));

-- Create a function for fuzzy text search with open rate ranking
CREATE OR REPLACE FUNCTION search_subject_lines(query TEXT)
RETURNS TABLE (
  subject_line TEXT,
  open_rate DECIMAL(5,4),
  similarity REAL,
  score REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.subject_line,
    sl.open_rate,
    similarity(sl.subject_line, query)::REAL as similarity,
    (0.7 * similarity(sl.subject_line, query) + 0.3 * sl.open_rate)::REAL as score
  FROM subject_lines sl
  WHERE sl.subject_line ILIKE '%' || query || '%'
  ORDER BY score DESC
  LIMIT 10;
  
  -- If we don't have enough results, add more based on open rate
  IF (SELECT COUNT(*) FROM subject_lines sl WHERE sl.subject_line ILIKE '%' || query || '%') < 5 THEN
    RETURN QUERY
    SELECT 
      sl.subject_line,
      sl.open_rate,
      similarity(sl.subject_line, query)::REAL as similarity,
      (0.7 * similarity(sl.subject_line, query) + 0.3 * sl.open_rate)::REAL as score
    FROM subject_lines sl
    WHERE sl.subject_line ILIKE '%' || query || '%'
    ORDER BY sl.open_rate DESC
    LIMIT 10;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Enable the pg_trgm extension for similarity function
CREATE EXTENSION IF NOT EXISTS pg_trgm;
