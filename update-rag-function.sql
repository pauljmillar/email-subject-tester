-- Update the find_similar_subject_lines function to include date_sent and spam_rate
-- This will NOT affect existing embeddings, only update the function definition

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
