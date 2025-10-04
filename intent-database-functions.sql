-- Database functions for intent-based chat system
-- This file contains all the database functions needed for the new intent API

-- 1. Get all companies in the database
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

-- 2. Get all industries in the database
CREATE OR REPLACE FUNCTION allIndustries()
RETURNS TABLE(industry text) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT sl.sub_industry
  FROM subject_lines sl
  WHERE sl.sub_industry IS NOT NULL
  ORDER BY sl.sub_industry;
END;
$$ LANGUAGE plpgsql;

-- 3. Enhanced vector similarity function with SQL conditions
CREATE OR REPLACE FUNCTION find_similar_subject_lines_with_filters(
  query_embedding vector(1536),
  similarity_threshold float DEFAULT 0.5,
  max_results int DEFAULT 10,
  company_filter text[] DEFAULT NULL,
  industry_filter text[] DEFAULT NULL,
  timeframe_filter text DEFAULT NULL
)
RETURNS TABLE(
  subject_line_id int,
  subject_line text,
  open_rate float,
  similarity_score float,
  company text,
  sub_industry text,
  date_sent date,
  spam_rate float,
  read_rate float,
  inbox_rate float
) AS $$
DECLARE
  date_condition text;
BEGIN
  -- Build date condition based on timeframe
  CASE timeframe_filter
    WHEN 'recent' THEN date_condition := 'sl.date_sent >= CURRENT_DATE - INTERVAL ''30 days''';
    WHEN 'last 3 months' THEN date_condition := 'sl.date_sent >= CURRENT_DATE - INTERVAL ''3 months''';
    WHEN 'this year' THEN date_condition := 'sl.date_sent >= DATE_TRUNC(''year'', CURRENT_DATE)';
    WHEN 'this quarter' THEN date_condition := 'sl.date_sent >= DATE_TRUNC(''quarter'', CURRENT_DATE)';
    WHEN 'last quarter' THEN date_condition := 'sl.date_sent >= DATE_TRUNC(''quarter'', CURRENT_DATE - INTERVAL ''3 months'') AND sl.date_sent < DATE_TRUNC(''quarter'', CURRENT_DATE)';
    WHEN 'this month' THEN date_condition := 'sl.date_sent >= DATE_TRUNC(''month'', CURRENT_DATE)';
    WHEN 'last month' THEN date_condition := 'sl.date_sent >= DATE_TRUNC(''month'', CURRENT_DATE - INTERVAL ''1 month'') AND sl.date_sent < DATE_TRUNC(''month'', CURRENT_DATE)';
    WHEN 'this week' THEN date_condition := 'sl.date_sent >= DATE_TRUNC(''week'', CURRENT_DATE)';
    ELSE date_condition := 'TRUE';
  END CASE;

  RETURN QUERY
  SELECT 
    sl.id,
    sl.subject_line,
    sl.open_rate,
    1 - (sle.embedding <=> query_embedding) as similarity_score,
    sl.company,
    sl.sub_industry,
    sl.date_sent,
    sl.spam_rate,
    sl.read_rate,
    sl.inbox_rate
  FROM subject_lines sl
  JOIN subject_line_embeddings sle ON sl.id = sle.subject_line_id
  WHERE 
    -- Vector similarity condition
    1 - (sle.embedding <=> query_embedding) > similarity_threshold
    -- Company filter
    AND (company_filter IS NULL OR sl.company = ANY(company_filter))
    -- Industry filter  
    AND (industry_filter IS NULL OR sl.sub_industry = ANY(industry_filter))
    -- Date filter
    AND (timeframe_filter IS NULL OR date_condition)
  ORDER BY sle.embedding <=> query_embedding
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql;

-- 4. Get volume data with filters
CREATE OR REPLACE FUNCTION getVolumes(
  company_filter text[] DEFAULT NULL,
  industry_filter text[] DEFAULT NULL,
  timeframe_filter text DEFAULT NULL
)
RETURNS TABLE(
  company text,
  sub_industry text,
  total_volume bigint,
  avg_volume_per_campaign float,
  date_sent date,
  campaign_description text,
  subject_line text
) AS $$
DECLARE
  date_condition text;
BEGIN
  -- Build date condition based on timeframe
  CASE timeframe_filter
    WHEN 'recent' THEN date_condition := 'sl.date_sent >= CURRENT_DATE - INTERVAL ''30 days''';
    WHEN 'last 3 months' THEN date_condition := 'sl.date_sent >= CURRENT_DATE - INTERVAL ''3 months''';
    WHEN 'this year' THEN date_condition := 'sl.date_sent >= DATE_TRUNC(''year'', CURRENT_DATE)';
    WHEN 'this quarter' THEN date_condition := 'sl.date_sent >= DATE_TRUNC(''quarter'', CURRENT_DATE)';
    WHEN 'last quarter' THEN date_condition := 'sl.date_sent >= DATE_TRUNC(''quarter'', CURRENT_DATE - INTERVAL ''3 months'') AND sl.date_sent < DATE_TRUNC(''quarter'', CURRENT_DATE)';
    WHEN 'this month' THEN date_condition := 'sl.date_sent >= DATE_TRUNC(''month'', CURRENT_DATE)';
    WHEN 'last month' THEN date_condition := 'sl.date_sent >= DATE_TRUNC(''month'', CURRENT_DATE - INTERVAL ''1 month'') AND sl.date_sent < DATE_TRUNC(''month'', CURRENT_DATE)';
    WHEN 'this week' THEN date_condition := 'sl.date_sent >= DATE_TRUNC(''week'', CURRENT_DATE)';
    ELSE date_condition := 'TRUE';
  END CASE;

  RETURN QUERY
  SELECT 
    sl.company,
    sl.sub_industry,
    sl.volume as total_volume,
    sl.avg_volume_per_campaign,
    sl.date_sent,
    CONCAT('Campaign: ', COALESCE(sl.campaign_name, 'Unknown'), ' - ', COALESCE(sl.description, 'No description')) as campaign_description,
    sl.subject_line
  FROM subject_lines sl
  WHERE 
    -- Company filter
    (company_filter IS NULL OR sl.company = ANY(company_filter))
    -- Industry filter  
    AND (industry_filter IS NULL OR sl.sub_industry = ANY(industry_filter))
    -- Date filter
    AND (timeframe_filter IS NULL OR date_condition)
    -- Only include records with volume data
    AND sl.volume IS NOT NULL
  ORDER BY sl.volume DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;

-- 5. Get open rates data with filters
CREATE OR REPLACE FUNCTION getOpenRates(
  company_filter text[] DEFAULT NULL,
  industry_filter text[] DEFAULT NULL,
  timeframe_filter text DEFAULT NULL
)
RETURNS TABLE(
  company text,
  sub_industry text,
  open_rate float,
  subject_line text,
  date_sent date,
  spam_rate float,
  read_rate float,
  inbox_rate float,
  mailing_type text
) AS $$
DECLARE
  date_condition text;
BEGIN
  -- Build date condition based on timeframe
  CASE timeframe_filter
    WHEN 'recent' THEN date_condition := 'sl.date_sent >= CURRENT_DATE - INTERVAL ''30 days''';
    WHEN 'last 3 months' THEN date_condition := 'sl.date_sent >= CURRENT_DATE - INTERVAL ''3 months''';
    WHEN 'this year' THEN date_condition := 'sl.date_sent >= DATE_TRUNC(''year'', CURRENT_DATE)';
    WHEN 'this quarter' THEN date_condition := 'sl.date_sent >= DATE_TRUNC(''quarter'', CURRENT_DATE)';
    WHEN 'last quarter' THEN date_condition := 'sl.date_sent >= DATE_TRUNC(''quarter'', CURRENT_DATE - INTERVAL ''3 months'') AND sl.date_sent < DATE_TRUNC(''quarter'', CURRENT_DATE)';
    WHEN 'this month' THEN date_condition := 'sl.date_sent >= DATE_TRUNC(''month'', CURRENT_DATE)';
    WHEN 'last month' THEN date_condition := 'sl.date_sent >= DATE_TRUNC(''month'', CURRENT_DATE - INTERVAL ''1 month'') AND sl.date_sent < DATE_TRUNC(''month'', CURRENT_DATE)';
    WHEN 'this week' THEN date_condition := 'sl.date_sent >= DATE_TRUNC(''week'', CURRENT_DATE)';
    ELSE date_condition := 'TRUE';
  END CASE;

  RETURN QUERY
  SELECT 
    sl.company,
    sl.sub_industry,
    sl.open_rate,
    sl.subject_line,
    sl.date_sent,
    sl.spam_rate,
    sl.read_rate,
    sl.inbox_rate,
    sl.mailing_type
  FROM subject_lines sl
  WHERE 
    -- Company filter
    (company_filter IS NULL OR sl.company = ANY(company_filter))
    -- Industry filter  
    AND (industry_filter IS NULL OR sl.sub_industry = ANY(industry_filter))
    -- Date filter
    AND (timeframe_filter IS NULL OR date_condition)
    -- Only include records with open rate data
    AND sl.open_rate IS NOT NULL
  ORDER BY sl.open_rate DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql;
