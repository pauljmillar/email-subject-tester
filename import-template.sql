-- Template for importing subject lines data
-- Replace the values below with your actual data

INSERT INTO subject_lines (
  subject_line,
  open_rate,
  date_sent,
  company,
  sub_industry,
  mailing_type,
  inbox_rate,
  spam_rate,
  read_rate,
  read_delete_rate,
  delete_without_read_rate,
  projected_volume
) VALUES
-- Example rows (replace with your actual data):
('Don''t miss 20% off top brands', 0.1176, '2025-09-24', 'Synchrony Bank', 'Financial Services - Investment', 'Acquisition', 0.9914, 0.0086, 0.1176, 0.0846, 0.2038, 14324900),
('Grab 10% off for your ride—plus, even more savings', 0.1041, '2025-09-03', 'Synchrony Bank', 'Financial Services - Credit Cards', 'Acquisition', 0.9862, 0.0138, 0.1041, 0.0792, 0.2186, 12698051);

-- To import all 3500 rows, you can:
-- 1. Use the Python script: python import-subject-lines.py your-file.csv
-- 2. Convert your CSV to SQL INSERT statements
-- 3. Use a CSV import tool in your database admin panel
