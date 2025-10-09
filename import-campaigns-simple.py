#!/usr/bin/env python3
"""
Simple CSV import script for marketing campaigns.
This is a more straightforward approach for smaller datasets.
"""

import csv
import os
import sys
import psycopg2
from psycopg2.extras import execute_values
from datetime import datetime

def clean_value(value, default=None):
    """Clean and validate CSV values"""
    if value is None or value == '' or value == 'None':
        return default
    return str(value).strip()

def parse_int(value):
    """Parse integer values"""
    if value is None or value == '' or value == 'None':
        return None
    try:
        return int(float(value))
    except (ValueError, TypeError):
        return None

def parse_decimal(value):
    """Parse decimal values"""
    if value is None or value == '' or value == 'None':
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None

def parse_date(value):
    """Parse date values"""
    if value is None or value == '' or value == 'None':
        return None
    try:
        for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y']:
            try:
                return datetime.strptime(str(value), fmt).date()
            except ValueError:
                continue
        return None
    except (ValueError, TypeError):
        return None

def parse_boolean(value):
    """Parse boolean values"""
    if value is None or value == '' or value == 'None':
        return False
    return str(value).lower() in ['true', '1', 'yes', 't']

def main():
    # Database connection - update these values
    conn = psycopg2.connect(
        host=os.getenv('DB_HOST', 'localhost'),
        database=os.getenv('DB_NAME', 'your_database_name'),
        user=os.getenv('DB_USER', 'your_username'),
        password=os.getenv('DB_PASSWORD', 'your_password'),
        port=os.getenv('DB_PORT', '5432')
    )
    
    cursor = conn.cursor()
    
    # Create table if not exists
    create_table_sql = """
    CREATE TABLE IF NOT EXISTS marketing_campaigns (
        id SERIAL PRIMARY KEY,
        campaign_id VARCHAR(255) NOT NULL UNIQUE,
        campaign_observation_date DATE NOT NULL,
        media_channel VARCHAR(100) NOT NULL,
        marketing_company VARCHAR(100) NOT NULL,
        industry VARCHAR(100) NOT NULL,
        subindustry VARCHAR(100),
        product_type VARCHAR(100),
        brand VARCHAR(100),
        product VARCHAR(100),
        bundled_products TEXT,
        properties VARCHAR(100),
        affiliated_company VARCHAR(100),
        post_link TEXT,
        landing_page TEXT,
        campaign_observation_country VARCHAR(10),
        estimated_volume INTEGER,
        estimated_spend DECIMAL(15,2),
        email_inbox_rate VARCHAR(50),
        email_spam_rate VARCHAR(50),
        email_read_rate VARCHAR(50),
        email_delete_rate VARCHAR(50),
        email_delete_without_read_rate VARCHAR(50),
        subject_line TEXT,
        email_sender_domain VARCHAR(255),
        social_post_type VARCHAR(50),
        social_engagement VARCHAR(50),
        digital_domain_ad_seen_on VARCHAR(255),
        panelist_location VARCHAR(100),
        metro_area VARCHAR(100),
        is_general_branding BOOLEAN DEFAULT FALSE,
        text_content TEXT,
        day_part VARCHAR(50),
        ad_duration_seconds INTEGER,
        channel VARCHAR(100),
        program VARCHAR(100),
        thumbnail_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    
    cursor.execute(create_table_sql)
    conn.commit()
    print("Table created successfully")
    
    # Get CSV file path
    csv_file_path = input("Enter the path to your CSV file: ").strip()
    
    if not os.path.exists(csv_file_path):
        print(f"CSV file not found: {csv_file_path}")
        sys.exit(1)
    
    # Process CSV file
    batch_size = 1000
    batch_data = []
    total_rows = 0
    
    print(f"Starting import of {csv_file_path}")
    
    with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        
        for row in reader:
            # Clean and prepare data
            cleaned_row = {
                'campaign_id': clean_value(row.get('Campaign ID')),
                'campaign_observation_date': parse_date(row.get('Campaign Observation Date')),
                'media_channel': clean_value(row.get('Media Channel')),
                'marketing_company': clean_value(row.get('Marketing Company')),
                'industry': clean_value(row.get('Industry')),
                'subindustry': clean_value(row.get('Subindustry')),
                'product_type': clean_value(row.get('Product Type')),
                'brand': clean_value(row.get('Brand')),
                'product': clean_value(row.get('Product')),
                'bundled_products': clean_value(row.get('Bundled Products')),
                'properties': clean_value(row.get('Properties')),
                'affiliated_company': clean_value(row.get('Affiliated Company')),
                'post_link': clean_value(row.get('Post Link')),
                'landing_page': clean_value(row.get('Landing Page')),
                'campaign_observation_country': clean_value(row.get('Campaign Observation Country')),
                'estimated_volume': parse_int(row.get('Estimated Volume')),
                'estimated_spend': parse_decimal(row.get('Estimated Spend')),
                'email_inbox_rate': clean_value(row.get('Email - Inbox Rate')),
                'email_spam_rate': clean_value(row.get('Email - Spam Rate')),
                'email_read_rate': clean_value(row.get('Email - Read Rate')),
                'email_delete_rate': clean_value(row.get('Email - Delete Rate')),
                'email_delete_without_read_rate': clean_value(row.get('Email - Delete Without Read Rate')),
                'subject_line': clean_value(row.get('Subject Line')),
                'email_sender_domain': clean_value(row.get('Email- Sender Domain')),
                'social_post_type': clean_value(row.get('Social - Post Type')),
                'social_engagement': clean_value(row.get('Social - Engagement')),
                'digital_domain_ad_seen_on': clean_value(row.get('Digital - Domain Ad Seen On')),
                'panelist_location': clean_value(row.get('Panelist Location')),
                'metro_area': clean_value(row.get('Metro Area')),
                'is_general_branding': parse_boolean(row.get('Is General Branding')),
                'text_content': clean_value(row.get('Text Content')),
                'day_part': clean_value(row.get('Day Part')),
                'ad_duration_seconds': parse_int(row.get('Ad Duration (seconds)')),
                'channel': clean_value(row.get('Channel')),
                'program': clean_value(row.get('Program')),
                'thumbnail_url': f"https://via.placeholder.com/150x100/4F46E5/FFFFFF?text={clean_value(row.get('Marketing Company'), 'Unknown').replace(' ', '+')}"
            }
            
            # Only add rows with required fields
            if (cleaned_row['campaign_id'] and 
                cleaned_row['campaign_observation_date'] and 
                cleaned_row['media_channel'] and 
                cleaned_row['marketing_company'] and 
                cleaned_row['industry']):
                
                batch_data.append(cleaned_row)
                
                # Insert batch when it reaches batch_size
                if len(batch_data) >= batch_size:
                    insert_batch(cursor, batch_data)
                    total_rows += len(batch_data)
                    print(f"Inserted {total_rows} rows so far...")
                    batch_data = []
    
    # Insert remaining data
    if batch_data:
        insert_batch(cursor, batch_data)
        total_rows += len(batch_data)
    
    conn.commit()
    print(f"Import completed successfully! Total rows: {total_rows}")
    
    cursor.close()
    conn.close()

def insert_batch(cursor, data):
    """Insert a batch of records"""
    columns = [
        'campaign_id', 'campaign_observation_date', 'media_channel', 'marketing_company',
        'industry', 'subindustry', 'product_type', 'brand', 'product', 'bundled_products',
        'properties', 'affiliated_company', 'post_link', 'landing_page', 'campaign_observation_country',
        'estimated_volume', 'estimated_spend', 'email_inbox_rate', 'email_spam_rate',
        'email_read_rate', 'email_delete_rate', 'email_delete_without_read_rate',
        'subject_line', 'email_sender_domain', 'social_post_type', 'social_engagement',
        'digital_domain_ad_seen_on', 'panelist_location', 'metro_area', 'is_general_branding',
        'text_content', 'day_part', 'ad_duration_seconds', 'channel', 'program', 'thumbnail_url'
    ]
    
    values = []
    for row in data:
        value_tuple = tuple(row.get(col) for col in columns)
        values.append(value_tuple)
    
    insert_sql = f"""
    INSERT INTO marketing_campaigns ({', '.join(columns)})
    VALUES %s
    ON CONFLICT (campaign_id) DO UPDATE SET
        campaign_observation_date = EXCLUDED.campaign_observation_date,
        media_channel = EXCLUDED.media_channel,
        marketing_company = EXCLUDED.marketing_company,
        industry = EXCLUDED.industry,
        estimated_volume = EXCLUDED.estimated_volume,
        estimated_spend = EXCLUDED.estimated_spend,
        updated_at = CURRENT_TIMESTAMP
    """
    
    execute_values(cursor, insert_sql, values, template=None, page_size=1000)

if __name__ == "__main__":
    main()
