-- Populate date_sent field with random dates over the last 3 months
-- This will help with timeframe filtering functionality

UPDATE subject_lines 
SET date_sent = (
    CURRENT_DATE - INTERVAL '1 day' * FLOOR(RANDOM() * 90)
)
WHERE date_sent IS NULL;

-- Verify the update
SELECT 
    COUNT(*) as total_records,
    COUNT(date_sent) as records_with_dates,
    MIN(date_sent) as earliest_date,
    MAX(date_sent) as latest_date
FROM subject_lines;

-- Show distribution of dates by month
SELECT 
    DATE_TRUNC('month', date_sent) as month,
    COUNT(*) as record_count
FROM subject_lines 
WHERE date_sent IS NOT NULL
GROUP BY DATE_TRUNC('month', date_sent)
ORDER BY month DESC;
