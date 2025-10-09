#!/usr/bin/env python3
"""
Import CSV data into Supabase marketing_campaigns table with duplicate handling.
When duplicates are found, keeps the row with the oldest campaign_observation_date.
Usage: python3 import-csv-supabase-fixed.py /path/to/your/file.csv
"""

import os
import sys
import csv
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv
import logging
from collections import defaultdict

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv('.env.local')

def clean_data(row):
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

def deduplicate_campaigns(campaigns):
    """Remove duplicates, keeping the row with the oldest campaign_observation_date"""
    campaign_dict = {}
    duplicates_found = 0
    
    for campaign in campaigns:
        campaign_id = campaign.get('campaign_id')
        if not campaign_id:
            continue
            
        # Parse the observation date for comparison
        obs_date_str = campaign.get('campaign_observation_date')
        if not obs_date_str:
            continue
            
        try:
            obs_date = datetime.strptime(obs_date_str, '%Y-%m-%d')
        except ValueError:
            continue
        
        # If we haven't seen this campaign_id before, or if this one is older
        if campaign_id not in campaign_dict or obs_date < campaign_dict[campaign_id]['obs_date']:
            if campaign_id in campaign_dict:
                duplicates_found += 1
            campaign_dict[campaign_id] = {
                'campaign': campaign,
                'obs_date': obs_date
            }
        else:
            duplicates_found += 1
    
    # Extract the campaigns (without the date metadata)
    deduplicated = [item['campaign'] for item in campaign_dict.values()]
    
    logger.info(f"Found {duplicates_found} duplicates, kept {len(deduplicated)} unique campaigns")
    return deduplicated

def import_csv(csv_file_path, batch_size=1000):
    """Import CSV data into Supabase with duplicate handling"""
    
    # Get Supabase credentials
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_key:
        logger.error("Missing Supabase credentials in .env.local")
        return False
    
    # Create Supabase client
    supabase: Client = create_client(supabase_url, supabase_key)
    logger.info("Connected to Supabase successfully")
    
    if not os.path.exists(csv_file_path):
        logger.error(f"CSV file not found: {csv_file_path}")
        return False
    
    try:
        total_rows = 0
        batch_data = []
        all_campaigns = []
        
        logger.info(f"Starting import of {csv_file_path}")
        logger.info("First pass: Reading and cleaning all data...")
        
        # First pass: Read and clean all data
        with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            for row in reader:
                cleaned_row = clean_data(row)
                
                # Only add rows with required fields
                if (cleaned_row.get('campaign_id') and 
                    cleaned_row.get('campaign_observation_date') and 
                    cleaned_row.get('media_channel') and 
                    cleaned_row.get('marketing_company') and 
                    cleaned_row.get('industry')):
                    
                    all_campaigns.append(cleaned_row)
        
        logger.info(f"Cleaned {len(all_campaigns)} rows from CSV")
        
        # Deduplicate campaigns (keep oldest observation date)
        logger.info("Deduplicating campaigns...")
        deduplicated_campaigns = deduplicate_campaigns(all_campaigns)
        
        logger.info(f"After deduplication: {len(deduplicated_campaigns)} unique campaigns")
        
        # Second pass: Insert deduplicated data in batches
        logger.info("Inserting deduplicated data...")
        
        for i in range(0, len(deduplicated_campaigns), batch_size):
            batch = deduplicated_campaigns[i:i + batch_size]
            
            try:
                result = supabase.table('marketing_campaigns').upsert(
                    batch,
                    on_conflict='campaign_id'
                ).execute()
                
                total_rows += len(batch)
                logger.info(f"Inserted {total_rows}/{len(deduplicated_campaigns)} rows...")
                
            except Exception as e:
                logger.error(f"Error inserting batch {i//batch_size + 1}: {e}")
                # Try inserting one by one as fallback
                logger.info("Trying individual inserts for this batch...")
                for campaign in batch:
                    try:
                        supabase.table('marketing_campaigns').upsert(campaign, on_conflict='campaign_id').execute()
                        total_rows += 1
                    except Exception as e2:
                        logger.warning(f"Failed to insert campaign {campaign.get('campaign_id')}: {e2}")
        
        logger.info(f"✅ Import completed successfully! Total rows inserted: {total_rows}")
        return True
        
    except Exception as e:
        logger.error(f"Error during import: {e}")
        return False

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 import-csv-supabase-fixed.py /path/to/your/file.csv")
        sys.exit(1)
    
    csv_file_path = sys.argv[1]
    success = import_csv(csv_file_path)
    
    if success:
        print("\n🎉 CSV import completed successfully!")
        print("Duplicates were handled by keeping the oldest campaign_observation_date.")
        print("You can now view the campaigns in your web application.")
    else:
        print("\n❌ CSV import failed.")
        print("Make sure the table has been created first.")

if __name__ == "__main__":
    main()
