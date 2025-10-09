-- Fix the find_similar_subject_lines_with_filters function with correct types
CREATE OR REPLACE FUNCTION find_similar_subject_lines_with_filters(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.3,
  max_results int DEFAULT 10,
  company_filter text[] DEFAULT NULL,
  industry_filter text[] DEFAULT NULL
)
RETURNS TABLE (
  subject_line_id int,
  subject_line text,
  company text,
  open_rate float,
  projected_volume int,
  similarity numeric
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
    AND (company_filter IS NULL OR sl.company = ANY(company_filter))
    AND (industry_filter IS NULL OR sl.sub_industry = ANY(industry_filter))
  ORDER BY sle.embedding <=> query_embedding
  LIMIT max_results;
END;
$$;
