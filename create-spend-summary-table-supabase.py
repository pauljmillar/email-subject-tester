#!/usr/bin/env python3
"""
Create the spend_summary table in Supabase.
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
    """Create the spend_summary table in Supabase"""
    
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
    CREATE TABLE IF NOT EXISTS spend_summary (
        id SERIAL PRIMARY KEY,
        date_coded VARCHAR(50) NOT NULL UNIQUE,
        chime DECIMAL(15,2),
        credit_karma DECIMAL(15,2),
        self_financial DECIMAL(15,2),
        american_express DECIMAL(15,2),
        capital_one DECIMAL(15,2),
        discover DECIMAL(15,2),
        dave DECIMAL(15,2),
        earnin DECIMAL(15,2),
        empower_finance DECIMAL(15,2),
        moneylion DECIMAL(15,2),
        ally DECIMAL(15,2),
        current DECIMAL(15,2),
        one_finance DECIMAL(15,2),
        varo DECIMAL(15,2),
        rocket_money DECIMAL(15,2),
        sofi DECIMAL(15,2),
        cashapp DECIMAL(15,2),
        paypal DECIMAL(15,2),
        venmo DECIMAL(15,2),
        bank_of_america DECIMAL(15,2),
        chase DECIMAL(15,2),
        wells_fargo DECIMAL(15,2),
        year VARCHAR(10),
        grand_total DECIMAL(15,2),
        category VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    
    # Create indexes
    indexes_sql = [
        "CREATE INDEX IF NOT EXISTS idx_spend_summary_date ON spend_summary(date_coded);",
        "CREATE INDEX IF NOT EXISTS idx_spend_summary_year ON spend_summary(year);",
        "CREATE INDEX IF NOT EXISTS idx_spend_summary_category ON spend_summary(category);"
    ]
    
    try:
        logger.info("Creating spend_summary table...")
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
        
        return True
        
    except Exception as e:
        logger.error(f"Error creating table: {e}")
        return False

if __name__ == "__main__":
    success = create_table()
    if success:
        print("\n🎉 Please run the SQL above in your Supabase SQL editor.")
        print("Then run the import script to load the data.")
    else:
        print("\n⚠️  Please run the SQL manually in your Supabase SQL editor.")
