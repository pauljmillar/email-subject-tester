-- New search function that implements word-by-word matching with priority system
CREATE OR REPLACE FUNCTION search_subject_lines_advanced(query TEXT)
RETURNS TABLE (
  subject_line TEXT,
  open_rate DECIMAL(5,4),
  similarity REAL,
  score REAL,
  company TEXT,
  sub_industry TEXT,
  mailing_type TEXT,
  read_rate DECIMAL(5,4),
  inbox_rate DECIMAL(5,4),
  match_type TEXT,
  word_positions INTEGER[]
) AS $$
DECLARE
  query_words TEXT[];
  word_count INTEGER;
  i INTEGER;
  j INTEGER;
  current_word TEXT;
  next_word TEXT;
  word_positions INTEGER[];
  match_score REAL;
BEGIN
  -- Split query into words and convert to lowercase
  query_words := string_to_array(lower(trim(query)), ' ');
  word_count := array_length(query_words, 1);
  
  -- If no words, return empty
  IF word_count IS NULL OR word_count = 0 THEN
    RETURN;
  END IF;
  
  -- Strategy 1: First word matches first word of subject line
  -- If multiple words, also check that subsequent words match in order
  RETURN QUERY
  SELECT 
    sl.subject_line,
    sl.open_rate,
    1.0::REAL as similarity, -- Perfect match for word position
    (0.9 + 0.1 * sl.open_rate)::REAL as score,
    sl.company,
    sl.sub_industry,
    sl.mailing_type,
    sl.read_rate,
    sl.inbox_rate,
    'first_word_match'::TEXT as match_type,
    ARRAY[1]::INTEGER[] as word_positions
  FROM subject_lines sl
  WHERE 
    -- First word matches first word of subject line
    lower(split_part(sl.subject_line, ' ', 1)) = query_words[1]
    AND (
      -- If only one word, that's all we need
      word_count = 1
      OR
      -- If multiple words, check that subsequent words match in order
      (
        word_count > 1 AND
        EXISTS (
          SELECT 1 FROM unnest(string_to_array(lower(sl.subject_line), ' ')) WITH ORDINALITY AS word(word, pos)
          WHERE word.pos > 1 
          AND word.word = query_words[2]
          AND (
            word_count = 2 
            OR EXISTS (
              SELECT 1 FROM unnest(string_to_array(lower(sl.subject_line), ' ')) WITH ORDINALITY AS word2(word2, pos2)
              WHERE word2.pos > word.pos 
              AND word2.word = query_words[3]
              AND (
                word_count = 3
                OR EXISTS (
                  SELECT 1 FROM unnest(string_to_array(lower(sl.subject_line), ' ')) WITH ORDINALITY AS word3(word3, pos3)
                  WHERE word3.pos > word2.pos 
                  AND word3.word = query_words[4]
                )
              )
            )
          )
        )
      )
    )
  ORDER BY sl.open_rate DESC
  LIMIT 10;
  
  -- Strategy 2: First word matches, but second word exists anywhere (not in position)
  IF word_count >= 2 THEN
    RETURN QUERY
    SELECT 
      sl.subject_line,
      sl.open_rate,
      0.8::REAL as similarity,
      (0.7 + 0.3 * sl.open_rate)::REAL as score,
      sl.company,
      sl.sub_industry,
      sl.mailing_type,
      sl.read_rate,
      sl.inbox_rate,
      'first_word_second_anywhere'::TEXT as match_type,
      ARRAY[1]::INTEGER[] as word_positions
    FROM subject_lines sl
    WHERE 
      -- First word matches first word of subject line
      lower(split_part(sl.subject_line, ' ', 1)) = query_words[1]
      -- Second word exists anywhere in the subject line
      AND sl.subject_line ILIKE '%' || query_words[2] || '%'
      -- But not in the exact second position (already covered by strategy 1)
      AND lower(split_part(sl.subject_line, ' ', 2)) != query_words[2]
      -- Avoid duplicates from strategy 1
      AND NOT EXISTS (
        SELECT 1 FROM unnest(string_to_array(lower(sl.subject_line), ' ')) WITH ORDINALITY AS word(word, pos)
        WHERE word.pos > 1 
        AND word.word = query_words[2]
      )
    ORDER BY sl.open_rate DESC
    LIMIT 5;
  END IF;
  
  -- Strategy 3: First word exists anywhere in subject line
  RETURN QUERY
  SELECT 
    sl.subject_line,
    sl.open_rate,
    0.6::REAL as similarity,
    (0.5 + 0.5 * sl.open_rate)::REAL as score,
    sl.company,
    sl.sub_industry,
    sl.mailing_type,
    sl.read_rate,
    sl.inbox_rate,
    'first_word_anywhere'::TEXT as match_type,
    ARRAY[]::INTEGER[] as word_positions
  FROM subject_lines sl
  WHERE 
    -- First word exists anywhere in subject line
    sl.subject_line ILIKE '%' || query_words[1] || '%'
    -- But not as the first word (already covered by strategies 1 and 2)
    AND lower(split_part(sl.subject_line, ' ', 1)) != query_words[1]
    -- If multiple words, also check that other words exist
    AND (
      word_count = 1
      OR (
        word_count = 2 AND sl.subject_line ILIKE '%' || query_words[2] || '%'
      )
      OR (
        word_count = 3 AND sl.subject_line ILIKE '%' || query_words[2] || '%' 
        AND sl.subject_line ILIKE '%' || query_words[3] || '%'
      )
      OR (
        word_count = 4 AND sl.subject_line ILIKE '%' || query_words[2] || '%' 
        AND sl.subject_line ILIKE '%' || query_words[3] || '%'
        AND sl.subject_line ILIKE '%' || query_words[4] || '%'
      )
    )
  ORDER BY sl.open_rate DESC
  LIMIT 5;
  
  -- Strategy 4: Fuzzy matching for partial words
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
    sl.inbox_rate,
    'fuzzy_match'::TEXT as match_type,
    ARRAY[]::INTEGER[] as word_positions
  FROM subject_lines sl
  WHERE 
    similarity(sl.subject_line, query) > 0.3
    -- Avoid duplicates from previous strategies
    AND NOT (
      lower(split_part(sl.subject_line, ' ', 1)) = query_words[1]
      OR sl.subject_line ILIKE '%' || query_words[1] || '%'
    )
  ORDER BY score DESC
  LIMIT 3;
  
END;
$$ LANGUAGE plpgsql;
