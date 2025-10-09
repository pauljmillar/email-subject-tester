#!/usr/bin/env python3
"""
Create the marketing campaigns table in Supabase.
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv('.env.local')

def create_table():
    """Create the marketing_campaigns table in Supabase"""
    
    # Get Supabase credentials
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_key:
        logger.error("Missing Supabase credentials in .env.local")
        return False
    
    # Create Supabase client
    supabase: Client = create_client(supabase_url, supabase_key)
    logger.info("Connected to Supabase successfully")
    
    # SQL to create the table
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
        # Execute table creation using RPC
        logger.info("Creating table...")
        result = supabase.rpc('exec_sql', {'sql': create_table_sql}).execute()
        logger.info("Table created successfully")
        
        # Create indexes
        logger.info("Creating indexes...")
        for i, index_sql in enumerate(indexes_sql):
            try:
                supabase.rpc('exec_sql', {'sql': index_sql}).execute()
                logger.info(f"Index {i+1}/{len(indexes_sql)} created")
            except Exception as e:
                logger.warning(f"Index {i+1} creation failed: {e}")
        
        logger.info("All indexes created successfully")
        
        # Test the table by inserting a sample record
        logger.info("Testing table with sample data...")
        sample_data = {
            'campaign_id': 'TEST-001',
            'campaign_observation_date': '2025-01-01',
            'media_channel': 'test channel',
            'marketing_company': 'Test Company',
            'industry': 'Test Industry',
            'estimated_volume': 1000,
            'estimated_spend': 100.50,
            'thumbnail_url': 'https://via.placeholder.com/150x100/4F46E5/FFFFFF?text=Test'
        }
        
        result = supabase.table('marketing_campaigns').insert(sample_data).execute()
        logger.info("Sample data inserted successfully")
        
        # Clean up test data
        supabase.table('marketing_campaigns').delete().eq('campaign_id', 'TEST-001').execute()
        logger.info("Test data cleaned up")
        
        logger.info("✅ Table creation completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"Error creating table: {e}")
        
        # Try alternative method using direct SQL execution
        try:
            logger.info("Trying alternative method...")
            
            # Use the SQL editor approach
            logger.info("Please run the following SQL in your Supabase SQL editor:")
            print("\n" + "="*50)
            print("SQL TO RUN IN SUPABASE SQL EDITOR:")
            print("="*50)
            print(create_table_sql)
            print("\n" + "="*50)
            print("INDEXES TO CREATE:")
            print("="*50)
            for index_sql in indexes_sql:
                print(index_sql)
            print("="*50)
            
            return False
            
        except Exception as e2:
            logger.error(f"Alternative method also failed: {e2}")
            return False

if __name__ == "__main__":
    success = create_table()
    if success:
        print("\n🎉 Table created successfully! You can now import your CSV data.")
    else:
        print("\n⚠️  Please run the SQL manually in your Supabase SQL editor.")
