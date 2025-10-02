-- Database De-duplication Script
-- This script removes duplicate subject lines from the subject_lines table

-- Option 1: Keep the record with the highest open_rate for each duplicate subject line
-- This is the recommended approach as it keeps the best-performing version

WITH ranked_subjects AS (
  SELECT 
    id,
    subject_line,
    open_rate,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(TRIM(subject_line)) 
      ORDER BY open_rate DESC, created_at DESC
    ) as rn
  FROM subject_lines
),
duplicates_to_delete AS (
  SELECT id 
  FROM ranked_subjects 
  WHERE rn > 1
)
DELETE FROM subject_lines 
WHERE id IN (SELECT id FROM duplicates_to_delete);

-- Show the results
SELECT 
  'De-duplication completed' as status,
  COUNT(*) as remaining_records
FROM subject_lines;

-- Optional: Show statistics about what was removed
-- Uncomment the following to see what duplicates were found:

/*
WITH duplicate_stats AS (
  SELECT 
    LOWER(TRIM(subject_line)) as normalized_subject,
    COUNT(*) as duplicate_count,
    MAX(open_rate) as best_open_rate,
    MIN(open_rate) as worst_open_rate
  FROM subject_lines
  GROUP BY LOWER(TRIM(subject_line))
  HAVING COUNT(*) > 1
)
SELECT 
  'Duplicate groups found: ' || COUNT(*) as groups,
  'Total duplicates: ' || SUM(duplicate_count - 1) as total_duplicates_removed
FROM duplicate_stats;
*/
