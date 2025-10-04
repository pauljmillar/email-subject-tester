-- Deploy database functions one by one
-- This approach creates functions individually to avoid issues

-- 1. Get all companies
CREATE OR REPLACE FUNCTION allCompanies()
RETURNS TABLE(company text) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT sl.company
  FROM subject_lines sl
  WHERE sl.company IS NOT NULL
  ORDER BY sl.company;
END;
$$ LANGUAGE plpgsql;
