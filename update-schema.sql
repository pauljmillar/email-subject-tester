-- Step 1: Add new columns to existing table
ALTER TABLE subject_lines 
ADD COLUMN IF NOT EXISTS date_sent DATE,
ADD COLUMN IF NOT EXISTS company TEXT,
ADD COLUMN IF NOT EXISTS sub_industry TEXT,
ADD COLUMN IF NOT EXISTS mailing_type TEXT,
ADD COLUMN IF NOT EXISTS inbox_rate DECIMAL(5,4),
ADD COLUMN IF NOT EXISTS spam_rate DECIMAL(5,4),
ADD COLUMN IF NOT EXISTS read_rate DECIMAL(5,4),
ADD COLUMN IF NOT EXISTS read_delete_rate DECIMAL(5,4),
ADD COLUMN IF NOT EXISTS delete_without_read_rate DECIMAL(5,4),
ADD COLUMN IF NOT EXISTS projected_volume BIGINT;

-- Step 2: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_company ON subject_lines (company);
CREATE INDEX IF NOT EXISTS idx_sub_industry ON subject_lines (sub_industry);
CREATE INDEX IF NOT EXISTS idx_mailing_type ON subject_lines (mailing_type);
CREATE INDEX IF NOT EXISTS idx_read_rate ON subject_lines (read_rate DESC);
CREATE INDEX IF NOT EXISTS idx_date_sent ON subject_lines (date_sent DESC);

-- Step 3: Drop the existing function first
DROP FUNCTION IF EXISTS search_subject_lines(TEXT);

-- Step 4: Create the new function with additional fields
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
