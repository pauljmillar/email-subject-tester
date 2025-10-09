#!/usr/bin/env python3
"""
Supabase-specific import script for marketing campaigns CSV data.
Uses Supabase client to create table and import data.
"""

import os
import sys
import csv
import pandas as pd
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv('.env.local')

class SupabaseCampaignImporter:
    def __init__(self):
        self.supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
        self.supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not self.supabase_url or not self.supabase_key:
            logger.error("Missing Supabase credentials in .env.local")
            sys.exit(1)
        
        self.supabase: Client = create_client(self.supabase_url, self.supabase_key)
        logger.info("Connected to Supabase successfully")
    
    def create_table(self):
        """Create the marketing_campaigns table using Supabase SQL"""
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
        
        # Create indexes
        indexes_sql = [
            "CREATE INDEX IF NOT EXISTS idx_campaigns_media_channel ON marketing_campaigns(media_channel);",
            "CREATE INDEX IF NOT EXISTS idx_campaigns_marketing_company ON marketing_campaigns(marketing_company);",
            "CREATE INDEX IF NOT EXISTS idx_campaigns_industry ON marketing_campaigns(industry);",
            "CREATE INDEX IF NOT EXISTS idx_campaigns_observation_date ON marketing_campaigns(campaign_observation_date);",
            "CREATE INDEX IF NOT EXISTS idx_campaigns_estimated_spend ON marketing_campaigns(estimated_spend);",
            "CREATE INDEX IF NOT EXISTS idx_campaigns_estimated_volume ON marketing_campaigns(estimated_volume);"
        ]
        
        try:
            # Execute table creation
            result = self.supabase.rpc('exec_sql', {'sql': create_table_sql}).execute()
            logger.info("Table created successfully")
            
            # Create indexes
            for index_sql in indexes_sql:
                self.supabase.rpc('exec_sql', {'sql': index_sql}).execute()
            
            logger.info("Indexes created successfully")
            
        except Exception as e:
            logger.error(f"Error creating table: {e}")
            # Try alternative method using direct SQL
            try:
                self.supabase.postgrest.rpc('exec_sql', {'sql': create_table_sql}).execute()
                logger.info("Table created using alternative method")
            except Exception as e2:
                logger.error(f"Alternative method also failed: {e2}")
                raise
    
    def clean_data(self, row):
        """Clean and validate data from CSV row"""
        def clean_value(value, default=None):
            if value is None or value == '' or value == 'None':
                return default
            return str(value).strip()
        
        def parse_int(value):
            if value is None or value == '' or value == 'None':
                return None
            try:
                return int(float(value))
            except (ValueError, TypeError):
                return None
        
        def parse_decimal(value):
            if value is None or value == '' or value == 'None':
                return None
            try:
                return float(value)
            except (ValueError, TypeError):
                return None
        
        def parse_date(value):
            if value is None or value == '' or value == 'None':
                return None
            try:
                for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y']:
                    try:
                        return datetime.strptime(str(value), fmt).strftime('%Y-%m-%d')
                    except ValueError:
                        continue
                return None
            except (ValueError, TypeError):
                return None
        
        def parse_boolean(value):
            if value is None or value == '' or value == 'None':
                return False
            return str(value).lower() in ['true', '1', 'yes', 't']
        
        # Clean the data
        cleaned = {
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
        }
        
        # Generate thumbnail URL
        company = cleaned.get('marketing_company', 'Unknown')
        if company and company != 'None':
            cleaned['thumbnail_url'] = f"https://via.placeholder.com/150x100/4F46E5/FFFFFF?text={company.replace(' ', '+')}"
        else:
            cleaned['thumbnail_url'] = "https://via.placeholder.com/150x100/6B7280/FFFFFF?text=Unknown"
        
        return cleaned
    
    def import_csv(self, csv_file_path, batch_size=1000):
        """Import CSV data in batches"""
        logger.info(f"Starting import of {csv_file_path}")
        
        try:
            total_rows = 0
            batch_data = []
            
            with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
                reader = csv.DictReader(csvfile)
                
                for row in reader:
                    cleaned_row = self.clean_data(row)
                    
                    # Only add rows with required fields
                    if (cleaned_row.get('campaign_id') and 
                        cleaned_row.get('campaign_observation_date') and 
                        cleaned_row.get('media_channel') and 
                        cleaned_row.get('marketing_company') and 
                        cleaned_row.get('industry')):
                        
                        batch_data.append(cleaned_row)
                        
                        # Insert batch when it reaches batch_size
                        if len(batch_data) >= batch_size:
                            self.insert_batch(batch_data)
                            total_rows += len(batch_data)
                            logger.info(f"Inserted {total_rows} rows so far...")
                            batch_data = []
            
            # Insert remaining data
            if batch_data:
                self.insert_batch(batch_data)
                total_rows += len(batch_data)
            
            logger.info(f"Import completed successfully! Total rows: {total_rows}")
            
        except Exception as e:
            logger.error(f"Error during import: {e}")
            raise
    
    def insert_batch(self, data):
        """Insert a batch of records using Supabase client"""
        try:
            # Use upsert to handle duplicates
            result = self.supabase.table('marketing_campaigns').upsert(
                data,
                on_conflict='campaign_id'
            ).execute()
            
            if hasattr(result, 'data'):
                logger.debug(f"Inserted {len(result.data)} records")
            
        except Exception as e:
            logger.error(f"Error inserting batch: {e}")
            # Try individual inserts as fallback
            for record in data:
                try:
                    self.supabase.table('marketing_campaigns').upsert(record).execute()
                except Exception as e2:
                    logger.warning(f"Failed to insert record {record.get('campaign_id')}: {e2}")

def main():
    """Main function to run the import"""
    # Get CSV file path
    csv_file_path = input("Enter the path to your CSV file: ").strip()
    
    if not os.path.exists(csv_file_path):
        logger.error(f"CSV file not found: {csv_file_path}")
        sys.exit(1)
    
    # Get batch size
    batch_size = int(input("Enter batch size (default 1000): ") or "1000")
    
    # Initialize importer
    importer = SupabaseCampaignImporter()
    
    try:
        # Create table
        logger.info("Creating table...")
        importer.create_table()
        
        # Import CSV
        logger.info("Starting CSV import...")
        importer.import_csv(csv_file_path, batch_size)
        
        logger.info("Import completed successfully!")
        
    except Exception as e:
        logger.error(f"Import failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
