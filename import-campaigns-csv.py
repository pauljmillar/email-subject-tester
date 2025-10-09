#!/usr/bin/env python3
"""
Script to import marketing campaigns CSV data into the database.
This script handles large CSV files efficiently with batch processing.
"""

import csv
import os
import sys
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import execute_values
import pandas as pd
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class CampaignImporter:
    def __init__(self, db_config: Dict[str, str]):
        self.db_config = db_config
        self.connection = None
        
    def connect(self):
        """Connect to the database"""
        try:
            self.connection = psycopg2.connect(**self.db_config)
            logger.info("Connected to database successfully")
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            sys.exit(1)
    
    def disconnect(self):
        """Disconnect from the database"""
        if self.connection:
            self.connection.close()
            logger.info("Disconnected from database")
    
    def create_table_if_not_exists(self):
        """Create the marketing_campaigns table if it doesn't exist"""
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
            cursor = self.connection.cursor()
            cursor.execute(create_table_sql)
            
            for index_sql in indexes_sql:
                cursor.execute(index_sql)
                
            self.connection.commit()
            cursor.close()
            logger.info("Table and indexes created successfully")
        except Exception as e:
            logger.error(f"Failed to create table: {e}")
            raise
    
    def clean_data(self, row: Dict[str, Any]) -> Dict[str, Any]:
        """Clean and validate data from CSV row"""
        cleaned = {}
        
        # Helper function to clean values
        def clean_value(value, default=None):
            if value is None or value == '' or value == 'None':
                return default
            return str(value).strip()
        
        # Helper function to parse boolean
        def parse_boolean(value):
            if value is None or value == '' or value == 'None':
                return False
            return str(value).lower() in ['true', '1', 'yes', 't']
        
        # Helper function to parse integer
        def parse_int(value):
            if value is None or value == '' or value == 'None':
                return None
            try:
                return int(float(value))
            except (ValueError, TypeError):
                return None
        
        # Helper function to parse decimal
        def parse_decimal(value):
            if value is None or value == '' or value == 'None':
                return None
            try:
                return float(value)
            except (ValueError, TypeError):
                return None
        
        # Helper function to parse date
        def parse_date(value):
            if value is None or value == '' or value == 'None':
                return None
            try:
                # Try different date formats
                for fmt in ['%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y']:
                    try:
                        return datetime.strptime(str(value), fmt).date()
                    except ValueError:
                        continue
                return None
            except (ValueError, TypeError):
                return None
        
        # Map CSV columns to database columns
        cleaned['campaign_id'] = clean_value(row.get('Campaign ID'))
        cleaned['campaign_observation_date'] = parse_date(row.get('Campaign Observation Date'))
        cleaned['media_channel'] = clean_value(row.get('Media Channel'))
        cleaned['marketing_company'] = clean_value(row.get('Marketing Company'))
        cleaned['industry'] = clean_value(row.get('Industry'))
        cleaned['subindustry'] = clean_value(row.get('Subindustry'))
        cleaned['product_type'] = clean_value(row.get('Product Type'))
        cleaned['brand'] = clean_value(row.get('Brand'))
        cleaned['product'] = clean_value(row.get('Product'))
        cleaned['bundled_products'] = clean_value(row.get('Bundled Products'))
        cleaned['properties'] = clean_value(row.get('Properties'))
        cleaned['affiliated_company'] = clean_value(row.get('Affiliated Company'))
        cleaned['post_link'] = clean_value(row.get('Post Link'))
        cleaned['landing_page'] = clean_value(row.get('Landing Page'))
        cleaned['campaign_observation_country'] = clean_value(row.get('Campaign Observation Country'))
        cleaned['estimated_volume'] = parse_int(row.get('Estimated Volume'))
        cleaned['estimated_spend'] = parse_decimal(row.get('Estimated Spend'))
        cleaned['email_inbox_rate'] = clean_value(row.get('Email - Inbox Rate'))
        cleaned['email_spam_rate'] = clean_value(row.get('Email - Spam Rate'))
        cleaned['email_read_rate'] = clean_value(row.get('Email - Read Rate'))
        cleaned['email_delete_rate'] = clean_value(row.get('Email - Delete Rate'))
        cleaned['email_delete_without_read_rate'] = clean_value(row.get('Email - Delete Without Read Rate'))
        cleaned['subject_line'] = clean_value(row.get('Subject Line'))
        cleaned['email_sender_domain'] = clean_value(row.get('Email- Sender Domain'))
        cleaned['social_post_type'] = clean_value(row.get('Social - Post Type'))
        cleaned['social_engagement'] = clean_value(row.get('Social - Engagement'))
        cleaned['digital_domain_ad_seen_on'] = clean_value(row.get('Digital - Domain Ad Seen On'))
        cleaned['panelist_location'] = clean_value(row.get('Panelist Location'))
        cleaned['metro_area'] = clean_value(row.get('Metro Area'))
        cleaned['is_general_branding'] = parse_boolean(row.get('Is General Branding'))
        cleaned['text_content'] = clean_value(row.get('Text Content'))
        cleaned['day_part'] = clean_value(row.get('Day Part'))
        cleaned['ad_duration_seconds'] = parse_int(row.get('Ad Duration (seconds)'))
        cleaned['channel'] = clean_value(row.get('Channel'))
        cleaned['program'] = clean_value(row.get('Program'))
        
        # Generate thumbnail URL based on marketing company
        company = cleaned.get('marketing_company', 'Unknown')
        if company and company != 'None':
            # Create a placeholder thumbnail URL
            cleaned['thumbnail_url'] = f"https://via.placeholder.com/150x100/4F46E5/FFFFFF?text={company.replace(' ', '+')}"
        else:
            cleaned['thumbnail_url'] = "https://via.placeholder.com/150x100/6B7280/FFFFFF?text=Unknown"
        
        return cleaned
    
    def import_csv_pandas(self, csv_file_path: str, batch_size: int = 1000):
        """Import CSV using pandas for better performance with large files"""
        logger.info(f"Starting import of {csv_file_path}")
        
        try:
            # Read CSV in chunks
            chunk_count = 0
            total_rows = 0
            
            for chunk in pd.read_csv(csv_file_path, chunksize=batch_size, low_memory=False):
                chunk_count += 1
                logger.info(f"Processing chunk {chunk_count} with {len(chunk)} rows")
                
                # Clean the data
                cleaned_data = []
                for _, row in chunk.iterrows():
                    cleaned_row = self.clean_data(row.to_dict())
                    # Only add rows with required fields
                    if (cleaned_row.get('campaign_id') and 
                        cleaned_row.get('campaign_observation_date') and 
                        cleaned_row.get('media_channel') and 
                        cleaned_row.get('marketing_company') and 
                        cleaned_row.get('industry')):
                        cleaned_data.append(cleaned_row)
                
                if cleaned_data:
                    self.insert_batch(cleaned_data)
                    total_rows += len(cleaned_data)
                    logger.info(f"Inserted {len(cleaned_data)} rows from chunk {chunk_count}")
            
            logger.info(f"Import completed. Total rows processed: {total_rows}")
            
        except Exception as e:
            logger.error(f"Error during import: {e}")
            raise
    
    def insert_batch(self, data: list):
        """Insert a batch of records using execute_values for better performance"""
        if not data:
            return
        
        cursor = self.connection.cursor()
        
        # Prepare the data for insertion
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
        
        # Use ON CONFLICT to handle duplicates
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
        
        try:
            execute_values(
                cursor, insert_sql, values, 
                template=None, page_size=1000
            )
            self.connection.commit()
        except Exception as e:
            self.connection.rollback()
            logger.error(f"Error inserting batch: {e}")
            raise
        finally:
            cursor.close()

def main():
    """Main function to run the import"""
    # Database configuration - update these values
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'database': os.getenv('DB_NAME', 'your_database_name'),
        'user': os.getenv('DB_USER', 'your_username'),
        'password': os.getenv('DB_PASSWORD', 'your_password'),
        'port': os.getenv('DB_PORT', '5432')
    }
    
    # CSV file path
    csv_file_path = input("Enter the path to your CSV file: ").strip()
    
    if not os.path.exists(csv_file_path):
        logger.error(f"CSV file not found: {csv_file_path}")
        sys.exit(1)
    
    # Batch size for processing
    batch_size = int(input("Enter batch size (default 1000): ") or "1000")
    
    # Initialize importer
    importer = CampaignImporter(db_config)
    
    try:
        # Connect to database
        importer.connect()
        
        # Create table if not exists
        importer.create_table_if_not_exists()
        
        # Import CSV
        importer.import_csv_pandas(csv_file_path, batch_size)
        
        logger.info("Import completed successfully!")
        
    except Exception as e:
        logger.error(f"Import failed: {e}")
        sys.exit(1)
    finally:
        importer.disconnect()

if __name__ == "__main__":
    main()
