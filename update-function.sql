-- Update the run_query function to match the actual table schema
CREATE OR REPLACE FUNCTION run_query(sql text)
RETURNS TABLE(
  id bigint,
  subject_line text,
  open_rate float,
  created_at timestamp with time zone,
  date_sent date,
  company text,
  sub_industry text,
  mailing_type text,
  inbox_rate float,
  spam_rate float,
  read_rate float,
  read_delete_rate float,
  delete_without_read_rate float,
  projected_volume bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE sql;
END;
$$;
