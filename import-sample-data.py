#!/usr/bin/env python3
"""
Import sample data into the marketing_campaigns table.
This will populate the table with sample data for testing.
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

def import_sample_data():
    """Import sample marketing campaigns data"""
    
    # Get Supabase credentials
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_key:
        logger.error("Missing Supabase credentials in .env.local")
        return False
    
    # Create Supabase client
    supabase: Client = create_client(supabase_url, supabase_key)
    logger.info("Connected to Supabase successfully")
    
    # Sample data
    sample_campaigns = [
        {
            'campaign_id': 'PAT:PIG/1001351060',
            'campaign_observation_date': '2025-09-05',
            'media_channel': 'paid instagram',
            'marketing_company': 'PayPal',
            'industry': 'Financial Services',
            'subindustry': 'Banking',
            'product_type': 'Payment Service',
            'brand': 'PayPal',
            'product': 'PayPal',
            'bundled_products': '',
            'properties': 'Consumer',
            'affiliated_company': 'PayPal',
            'post_link': 'https://www.instagram.com/paypal/p/DNB6ZKJtw1G/',
            'landing_page': 'None',
            'campaign_observation_country': 'us',
            'estimated_volume': 12890,
            'estimated_spend': 105.99,
            'email_inbox_rate': 'None',
            'email_spam_rate': 'None',
            'email_read_rate': 'None',
            'email_delete_rate': 'None',
            'email_delete_without_read_rate': 'None',
            'subject_line': 'None',
            'email_sender_domain': 'None',
            'social_post_type': 'Photo',
            'social_engagement': 'None',
            'digital_domain_ad_seen_on': 'None',
            'panelist_location': 'Kansas',
            'metro_area': 'Kansas City',
            'is_general_branding': False,
            'text_content': 'Get smart security and added peace of mind with PayPal. Safely shop at sites around the world.',
            'day_part': 'None',
            'ad_duration_seconds': None,
            'channel': 'None',
            'program': 'None',
            'thumbnail_url': 'https://via.placeholder.com/150x100/4F46E5/FFFFFF?text=PayPal'
        },
        {
            'campaign_id': 'PAT:PIG/482601001',
            'campaign_observation_date': '2025-09-01',
            'media_channel': 'paid instagram',
            'marketing_company': 'Venmo',
            'industry': 'Financial Services',
            'subindustry': '',
            'product_type': '',
            'brand': '',
            'product': '',
            'bundled_products': '',
            'properties': '',
            'affiliated_company': '',
            'post_link': 'None',
            'landing_page': 'None',
            'campaign_observation_country': 'us',
            'estimated_volume': 52164,
            'estimated_spend': 428.92,
            'email_inbox_rate': 'None',
            'email_spam_rate': 'None',
            'email_read_rate': 'None',
            'email_delete_rate': 'None',
            'email_delete_without_read_rate': 'None',
            'subject_line': 'None',
            'email_sender_domain': 'None',
            'social_post_type': 'Reel',
            'social_engagement': 'None',
            'digital_domain_ad_seen_on': 'None',
            'panelist_location': 'Michigan',
            'metro_area': 'Detroit',
            'is_general_branding': False,
            'text_content': 'None',
            'day_part': 'None',
            'ad_duration_seconds': None,
            'channel': 'None',
            'program': 'None',
            'thumbnail_url': 'https://via.placeholder.com/150x100/059669/FFFFFF?text=Venmo'
        },
        {
            'campaign_id': 'PAT:FB/2001351060',
            'campaign_observation_date': '2025-08-28',
            'media_channel': 'paid facebook',
            'marketing_company': 'Chase',
            'industry': 'Financial Services',
            'estimated_volume': 25000,
            'estimated_spend': 350.50,
            'thumbnail_url': 'https://via.placeholder.com/150x100/DC2626/FFFFFF?text=Chase'
        },
        {
            'campaign_id': 'PAT:GOOG/3001351060',
            'campaign_observation_date': '2025-08-25',
            'media_channel': 'paid google',
            'marketing_company': 'Wells Fargo',
            'industry': 'Financial Services',
            'estimated_volume': 18000,
            'estimated_spend': 280.75,
            'thumbnail_url': 'https://via.placeholder.com/150x100/7C3AED/FFFFFF?text=Wells+Fargo'
        },
        {
            'campaign_id': 'PAT:TW/4001351060',
            'campaign_observation_date': '2025-08-22',
            'media_channel': 'paid twitter',
            'marketing_company': 'Bank of America',
            'industry': 'Financial Services',
            'estimated_volume': 32000,
            'estimated_spend': 450.25,
            'thumbnail_url': 'https://via.placeholder.com/150x100/1E40AF/FFFFFF?text=BofA'
        },
        {
            'campaign_id': 'PAT:YT/5001351060',
            'campaign_observation_date': '2025-08-20',
            'media_channel': 'paid youtube',
            'marketing_company': 'Capital One',
            'industry': 'Financial Services',
            'estimated_volume': 15000,
            'estimated_spend': 220.80,
            'thumbnail_url': 'https://via.placeholder.com/150x100/F59E0B/FFFFFF?text=Capital+One'
        },
        {
            'campaign_id': 'PAT:IG/6001351060',
            'campaign_observation_date': '2025-08-18',
            'media_channel': 'paid instagram',
            'marketing_company': 'American Express',
            'industry': 'Financial Services',
            'estimated_volume': 28000,
            'estimated_spend': 380.90,
            'thumbnail_url': 'https://via.placeholder.com/150x100/EF4444/FFFFFF?text=AmEx'
        },
        {
            'campaign_id': 'PAT:FB/7001351060',
            'campaign_observation_date': '2025-08-15',
            'media_channel': 'paid facebook',
            'marketing_company': 'Discover',
            'industry': 'Financial Services',
            'estimated_volume': 12000,
            'estimated_spend': 195.60,
            'thumbnail_url': 'https://via.placeholder.com/150x100/10B981/FFFFFF?text=Discover'
        },
        {
            'campaign_id': 'PAT:GOOG/8001351060',
            'campaign_observation_date': '2025-08-12',
            'media_channel': 'paid google',
            'marketing_company': 'Citi',
            'industry': 'Financial Services',
            'estimated_volume': 22000,
            'estimated_spend': 320.40,
            'thumbnail_url': 'https://via.placeholder.com/150x100/8B5CF6/FFFFFF?text=Citi'
        },
        {
            'campaign_id': 'PAT:TW/9001351060',
            'campaign_observation_date': '2025-08-10',
            'media_channel': 'paid twitter',
            'marketing_company': 'US Bank',
            'industry': 'Financial Services',
            'estimated_volume': 16000,
            'estimated_spend': 240.30,
            'thumbnail_url': 'https://via.placeholder.com/150x100/06B6D4/FFFFFF?text=US+Bank'
        }
    ]
    
    try:
        logger.info("Inserting sample data...")
        
        # Insert data in batches
        batch_size = 5
        for i in range(0, len(sample_campaigns), batch_size):
            batch = sample_campaigns[i:i + batch_size]
            
            result = supabase.table('marketing_campaigns').upsert(
                batch,
                on_conflict='campaign_id'
            ).execute()
            
            logger.info(f"Inserted batch {i//batch_size + 1}/{(len(sample_campaigns) + batch_size - 1)//batch_size}")
        
        logger.info("✅ Sample data imported successfully!")
        
        # Verify the data
        result = supabase.table('marketing_campaigns').select('*').execute()
        logger.info(f"Total records in table: {len(result.data)}")
        
        return True
        
    except Exception as e:
        logger.error(f"Error importing sample data: {e}")
        return False

if __name__ == "__main__":
    success = import_sample_data()
    if success:
        print("\n🎉 Sample data imported successfully!")
        print("You can now view the campaigns in your web application.")
    else:
        print("\n❌ Failed to import sample data.")
        print("Make sure the table has been created first.")
