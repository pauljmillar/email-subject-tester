-- Create the subject_lines table
CREATE TABLE IF NOT EXISTS subject_lines (
  id SERIAL PRIMARY KEY,
  subject_line TEXT NOT NULL,
  open_rate DECIMAL(5,4) NOT NULL, -- Store as decimal (0.0000 to 1.0000)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create an index for faster text search
CREATE INDEX IF NOT EXISTS idx_subject_line_text ON subject_lines USING gin(to_tsvector('english', subject_line));

-- Enhanced search function with multiple strategies
CREATE OR REPLACE FUNCTION search_subject_lines(query TEXT)
RETURNS TABLE (
  subject_line TEXT,
  open_rate DECIMAL(5,4),
  similarity REAL,
  score REAL
) AS $$
DECLARE
  stemmed_query TEXT;
  word_variants TEXT[];
  word TEXT;
BEGIN
  -- Create word variants for better matching
  stemmed_query := lower(trim(query));
  
  -- Extract individual words and create variants
  SELECT array_agg(DISTINCT word) INTO word_variants
  FROM (
    SELECT unnest(string_to_array(stemmed_query, ' ')) as word
    UNION
    -- Add singular forms (remove 's' from end)
    SELECT regexp_replace(unnest(string_to_array(stemmed_query, ' ')), 's$', '') as word
    WHERE unnest(string_to_array(stemmed_query, ' ')) ~ 's$'
    UNION
    -- Add plural forms (add 's' to end)
    SELECT unnest(string_to_array(stemmed_query, ' ')) || 's' as word
    WHERE unnest(string_to_array(stemmed_query, ' ')) !~ 's$'
  ) variants
  WHERE word != '' AND length(word) > 1;
  
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
  
  -- Strategy 2: Individual word matching with variants
  IF word_variants IS NOT NULL AND array_length(word_variants, 1) > 0 THEN
    RETURN QUERY
    SELECT 
      sl.subject_line,
      sl.open_rate,
      similarity(sl.subject_line, query)::REAL as similarity,
      (0.6 * similarity(sl.subject_line, query) + 0.4 * sl.open_rate)::REAL as score
    FROM subject_lines sl
    WHERE sl.subject_line ILIKE ANY(
      SELECT '%' || word || '%' FROM unnest(word_variants) as word
    )
    AND sl.subject_line NOT ILIKE '%' || query || '%'  -- Avoid duplicates
    ORDER BY score DESC
    LIMIT 5;
  END IF;
  
  -- Strategy 3: Fuzzy matching with lower threshold
  RETURN QUERY
  SELECT 
    sl.subject_line,
    sl.open_rate,
    similarity(sl.subject_line, query)::REAL as similarity,
    (0.5 * similarity(sl.subject_line, query) + 0.5 * sl.open_rate)::REAL as score
  FROM subject_lines sl
  WHERE similarity(sl.subject_line, query) > 0.1  -- Lower threshold
  AND sl.subject_line NOT ILIKE '%' || query || '%'  -- Avoid duplicates
  ORDER BY score DESC
  LIMIT 5;
  
  -- Strategy 4: High open rate fallback (if still not enough results)
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

-- Create an additional full-text search function for even better results
CREATE OR REPLACE FUNCTION search_subject_lines_advanced(query TEXT)
RETURNS TABLE (
  subject_line TEXT,
  open_rate DECIMAL(5,4),
  similarity REAL,
  score REAL,
  match_type TEXT
) AS $$
DECLARE
  search_terms TEXT[];
  term TEXT;
BEGIN
  -- Split query into individual terms
  search_terms := string_to_array(lower(trim(query)), ' ');
  
  -- Strategy 1: Full-text search with ranking
  RETURN QUERY
  SELECT 
    sl.subject_line,
    sl.open_rate,
    similarity(sl.subject_line, query)::REAL as similarity,
    (0.7 * similarity(sl.subject_line, query) + 0.3 * sl.open_rate)::REAL as score,
    'fulltext'::TEXT as match_type
  FROM subject_lines sl
  WHERE to_tsvector('english', sl.subject_line) @@ plainto_tsquery('english', query)
  ORDER BY score DESC
  LIMIT 3;
  
  -- Strategy 2: Individual term matching
  FOREACH term IN ARRAY search_terms
  LOOP
    IF length(term) > 2 THEN
      RETURN QUERY
      SELECT 
        sl.subject_line,
        sl.open_rate,
        similarity(sl.subject_line, term)::REAL as similarity,
        (0.6 * similarity(sl.subject_line, term) + 0.4 * sl.open_rate)::REAL as score,
        'term'::TEXT as match_type
      FROM subject_lines sl
      WHERE sl.subject_line ILIKE '%' || term || '%'
      AND NOT EXISTS (
        SELECT 1 FROM search_subject_lines_advanced(query) existing 
        WHERE existing.subject_line = sl.subject_line
      )
      ORDER BY score DESC
      LIMIT 2;
    END IF;
  END LOOP;
  
  -- Strategy 3: Stemmed matching (balance/balances)
  FOREACH term IN ARRAY search_terms
  LOOP
    IF length(term) > 2 THEN
      -- Try singular form
      IF term ~ 's$' THEN
        RETURN QUERY
        SELECT 
          sl.subject_line,
          sl.open_rate,
          similarity(sl.subject_line, regexp_replace(term, 's$', ''))::REAL as similarity,
          (0.5 * similarity(sl.subject_line, regexp_replace(term, 's$', '')) + 0.5 * sl.open_rate)::REAL as score,
          'stemmed'::TEXT as match_type
        FROM subject_lines sl
        WHERE sl.subject_line ILIKE '%' || regexp_replace(term, 's$', '') || '%'
        AND NOT EXISTS (
          SELECT 1 FROM search_subject_lines_advanced(query) existing 
          WHERE existing.subject_line = sl.subject_line
        )
        ORDER BY score DESC
        LIMIT 2;
      END IF;
      
      -- Try plural form
      IF term !~ 's$' THEN
        RETURN QUERY
        SELECT 
          sl.subject_line,
          sl.open_rate,
          similarity(sl.subject_line, term || 's')::REAL as similarity,
          (0.5 * similarity(sl.subject_line, term || 's') + 0.5 * sl.open_rate)::REAL as score,
          'stemmed'::TEXT as match_type
        FROM subject_lines sl
        WHERE sl.subject_line ILIKE '%' || term || 's' || '%'
        AND NOT EXISTS (
          SELECT 1 FROM search_subject_lines_advanced(query) existing 
          WHERE existing.subject_line = sl.subject_line
        )
        ORDER BY score DESC
        LIMIT 2;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
