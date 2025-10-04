-- Update the function to handle SQL with semicolons
CREATE OR REPLACE FUNCTION run_query(sql text)
RETURNS TABLE(result jsonb)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    clean_sql text;
BEGIN
    -- Remove trailing semicolon if present
    clean_sql := trim(sql);
    IF right(clean_sql, 1) = ';' THEN
        clean_sql := left(clean_sql, length(clean_sql) - 1);
    END IF;
    
    RETURN QUERY EXECUTE format('SELECT to_jsonb(t.*) as result FROM (%s) t', clean_sql);
END;
$$;
