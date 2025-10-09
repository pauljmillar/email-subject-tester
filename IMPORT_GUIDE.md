# Marketing Campaigns CSV Import Guide

This guide will help you upload your 50k rows of marketing campaigns data into the database.

## Prerequisites

1. **Database Setup**: You need a PostgreSQL database running
2. **Python Environment**: Python 3.7+ with required packages
3. **CSV File**: Your marketing campaigns CSV file

## Option 1: Using the Advanced Import Script (Recommended for 50k rows)

### Step 1: Install Dependencies

```bash
pip install -r requirements-import.txt
```

### Step 2: Set Up Environment Variables

Create a `.env` file with your database credentials:

```bash
cp db-config-example.env .env
```

Edit `.env` with your actual database credentials:

```env
DB_HOST=localhost
DB_NAME=your_database_name
DB_USER=your_username
DB_PASSWORD=your_password
DB_PORT=5432
```

### Step 3: Run the Import Script

```bash
python import-campaigns-csv.py
```

**Features of the advanced script:**
- ✅ Handles large files efficiently with chunked processing
- ✅ Batch processing (default 1000 rows per batch)
- ✅ Data validation and cleaning
- ✅ Duplicate handling with ON CONFLICT
- ✅ Progress logging
- ✅ Error handling and rollback

## Option 2: Using the Simple Import Script

For smaller datasets or if you prefer a simpler approach:

```bash
python import-campaigns-simple.py
```

## Option 3: Direct Database Import (PostgreSQL)

If you have direct access to your PostgreSQL database:

### Step 1: Create the table first

```bash
psql -h your_host -U your_user -d your_database -f create-campaigns-table.sql
```

### Step 2: Import CSV directly

```bash
psql -h your_host -U your_user -d your_database -c "
COPY marketing_campaigns (
    campaign_id, campaign_observation_date, media_channel, marketing_company,
    industry, subindustry, product_type, brand, product, bundled_products,
    properties, affiliated_company, post_link, landing_page, campaign_observation_country,
    estimated_volume, estimated_spend, email_inbox_rate, email_spam_rate,
    email_read_rate, email_delete_rate, email_delete_without_read_rate,
    subject_line, email_sender_domain, social_post_type, social_engagement,
    digital_domain_ad_seen_on, panelist_location, metro_area, is_general_branding,
    text_content, day_part, ad_duration_seconds, channel, program
)
FROM '/path/to/your/csv/file.csv'
WITH (FORMAT csv, HEADER true);
"
```

## Option 4: Using Supabase (If you're using Supabase)

### Step 1: Create the table in Supabase

Run the SQL from `create-campaigns-table.sql` in your Supabase SQL editor.

### Step 2: Use Supabase Dashboard

1. Go to your Supabase dashboard
2. Navigate to Table Editor
3. Select the `marketing_campaigns` table
4. Click "Insert" → "Import data from CSV"
5. Upload your CSV file

## Data Validation and Cleaning

The import scripts automatically handle:

- **Date Formatting**: Converts various date formats to PostgreSQL DATE
- **Number Parsing**: Handles integers and decimals properly
- **Boolean Conversion**: Converts text to boolean values
- **Null Handling**: Replaces empty strings and 'None' with NULL
- **Duplicate Handling**: Uses ON CONFLICT to handle duplicate campaign IDs
- **Thumbnail Generation**: Creates placeholder thumbnail URLs

## Performance Tips for 50k Rows

1. **Use Batch Processing**: The scripts process data in batches of 1000 rows
2. **Index Creation**: Indexes are created automatically for better query performance
3. **Memory Management**: The advanced script uses chunked reading to handle large files
4. **Transaction Management**: Each batch is committed separately to avoid memory issues

## Troubleshooting

### Common Issues:

1. **Memory Issues**: Reduce batch size in the script
2. **Connection Timeout**: Increase database timeout settings
3. **CSV Encoding**: Ensure your CSV is UTF-8 encoded
4. **Date Format**: Check that dates are in a recognized format (YYYY-MM-DD, MM/DD/YYYY, DD/MM/YYYY)

### Performance Monitoring:

```sql
-- Check import progress
SELECT COUNT(*) FROM marketing_campaigns;

-- Check for duplicates
SELECT campaign_id, COUNT(*) 
FROM marketing_campaigns 
GROUP BY campaign_id 
HAVING COUNT(*) > 1;

-- Check data quality
SELECT 
    COUNT(*) as total_rows,
    COUNT(CASE WHEN campaign_id IS NOT NULL THEN 1 END) as valid_campaign_ids,
    COUNT(CASE WHEN estimated_spend > 0 THEN 1 END) as rows_with_spend
FROM marketing_campaigns;
```

## Expected Results

After successful import, you should have:
- ✅ All 50k rows imported
- ✅ Proper data types and formatting
- ✅ Indexes for fast querying
- ✅ Thumbnail URLs generated
- ✅ No duplicate campaign IDs

## Next Steps

Once imported, your campaigns table will be available in the web application with:
- Sortable columns
- Search functionality
- Filtering by media channel and marketing company
- Pagination for large datasets
