-- Hybrid search function that combines vector similarity with keyword matching
-- This provides better results for subject line suggestions

CREATE OR REPLACE FUNCTION find_hybrid_similar_subject_lines(
  query_text TEXT,
  query_embedding VECTOR(1536),
  similarity_threshold FLOAT DEFAULT 0.4,
  max_results INTEGER DEFAULT 10
)
RETURNS TABLE (
  subject_line_id INTEGER,
  subject_line TEXT,
  open_rate DECIMAL(5,4),
  similarity_score FLOAT,
  keyword_score FLOAT,
  combined_score FLOAT,
  company TEXT,
  sub_industry TEXT,
  mailing_type TEXT,
  read_rate DECIMAL(5,4),
  inbox_rate DECIMAL(5,4),
  date_sent DATE,
  spam_rate DECIMAL(5,4)
) AS $$
DECLARE
  query_words TEXT[];
  word_count INTEGER;
BEGIN
  -- Extract keywords from query
  query_words := string_to_array(lower(trim(query_text)), ' ');
  word_count := array_length(query_words, 1);
  
  -- If no words, return empty
  IF word_count IS NULL OR word_count = 0 THEN
    RETURN;
  END IF;
  
  RETURN QUERY
  SELECT 
    sl.id as subject_line_id,
    sl.subject_line,
    sl.open_rate,
    -- Vector similarity score
    1 - (sle.embedding <=> query_embedding) as similarity_score,
    -- Keyword matching score (percentage of query words found)
    (
      SELECT COUNT(*)::FLOAT / word_count
      FROM unnest(query_words) AS word
      WHERE sl.subject_line ILIKE '%' || word || '%'
    ) as keyword_score,
    -- Combined score: 60% vector similarity + 40% keyword matching
    (
      0.6 * (1 - (sle.embedding <=> query_embedding)) + 
      0.4 * (
        SELECT COUNT(*)::FLOAT / word_count
        FROM unnest(query_words) AS word
        WHERE sl.subject_line ILIKE '%' || word || '%'
      )
    ) as combined_score,
    sl.company,
    sl.sub_industry,
    sl.mailing_type,
    sl.read_rate,
    sl.inbox_rate,
    sl.date_sent,
    sl.spam_rate
  FROM subject_line_embeddings sle
  JOIN subject_lines sl ON sle.subject_line_id = sl.id
  WHERE 
    -- Either vector similarity OR keyword matching meets threshold
    (
      (1 - (sle.embedding <=> query_embedding)) >= similarity_threshold
      OR
      (
        SELECT COUNT(*)::FLOAT / word_count
        FROM unnest(query_words) AS word
        WHERE sl.subject_line ILIKE '%' || word || '%'
      ) >= 0.3  -- At least 30% of keywords must match
    )
  ORDER BY 
    -- Primary sort: combined score
    combined_score DESC,
    -- Secondary sort: open rate for tie-breaking
    sl.open_rate DESC
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;
