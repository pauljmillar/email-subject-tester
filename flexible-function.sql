-- Create a more flexible function that can handle any SQL query
CREATE OR REPLACE FUNCTION run_query(sql text)
RETURNS TABLE(result jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE format('SELECT to_jsonb(t.*) as result FROM (%s) t', sql);
END;
$$;
