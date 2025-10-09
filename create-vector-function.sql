-- Create the find_similar_subject_lines function
CREATE OR REPLACE FUNCTION find_similar_subject_lines(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.7,
  max_results int DEFAULT 10
)
RETURNS TABLE (
  subject_line_id int,
  subject_line text,
  company text,
  open_rate float,
  projected_volume int,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sl.id as subject_line_id,
    sl.subject_line,
    sl.company,
    sl.open_rate,
    sl.projected_volume,
    1 - (sle.embedding <=> query_embedding) as similarity
  FROM subject_line_embeddings sle
  JOIN subject_lines sl ON sle.subject_line_id = sl.id
  WHERE 1 - (sle.embedding <=> query_embedding) > similarity_threshold
  ORDER BY sle.embedding <=> query_embedding
  LIMIT max_results;
END;
$$;
