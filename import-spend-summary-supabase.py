#!/usr/bin/env python3
"""
Import spend_summary CSV data into Supabase.
Usage: python3 import-spend-summary-supabase.py /path/to/your/file.csv
"""

import os
import sys
import csv
from decimal import Decimal
from supabase import create_client, Client
from dotenv import load_dotenv
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv('.env.local')

def clean_currency_value(value):
    """Clean currency values by removing $ and commas"""
    if not value or value == '' or value == 'None':
        return None
    
    # Remove $ and commas
    cleaned = str(value).replace('$', '').replace(',', '').strip()
    
    if cleaned == '' or cleaned == 'None':
        return None
    
    try:
        return float(cleaned)
    except (ValueError, TypeError):
        return None

def clean_data(row):
    """Clean and validate data from CSV row"""
    cleaned = {
        'date_coded': str(row.get('DATE (Coded)', '')).strip(),
        'chime': clean_currency_value(row.get('Chime')),
        'credit_karma': clean_currency_value(row.get('Credit Karma')),
        'self_financial': clean_currency_value(row.get('Self Financial, Inc.')),
        'american_express': clean_currency_value(row.get('American Express')),
        'capital_one': clean_currency_value(row.get('Capital One')),
        'discover': clean_currency_value(row.get('Discover')),
        'dave': clean_currency_value(row.get('Dave')),
        'earnin': clean_currency_value(row.get('Earnin')),
        'empower_finance': clean_currency_value(row.get('Empower Finance, Inc.')),
        'moneylion': clean_currency_value(row.get('MoneyLion')),
        'ally': clean_currency_value(row.get('Ally')),
        'current': clean_currency_value(row.get('Current')),
        'one_finance': clean_currency_value(row.get('One Finance')),
        'varo': clean_currency_value(row.get('Varo')),
        'rocket_money': clean_currency_value(row.get('Rocket Money')),
        'sofi': clean_currency_value(row.get('SoFI')),
        'cashapp': clean_currency_value(row.get('CashApp')),
        'paypal': clean_currency_value(row.get('PayPal')),
        'venmo': clean_currency_value(row.get('Venmo')),
        'bank_of_america': clean_currency_value(row.get('Bank of America')),
        'chase': clean_currency_value(row.get('Chase')),
        'wells_fargo': clean_currency_value(row.get('Wells Fargo')),
        'year': str(row.get('YEAR', '')).strip() if row.get('YEAR') else None,
        'grand_total': clean_currency_value(row.get('Grand Total')),
        'category': str(row.get('Category', '')).strip() if row.get('Category') else None
    }
    
    return cleaned

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
        date_coded VARCHAR(50) NOT NULL,
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

def import_csv(csv_file_path):
    """Import CSV data into Supabase"""
    
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
        
        logger.info(f"Starting import of {csv_file_path}")
        
        with open(csv_file_path, 'r', encoding='utf-8') as csvfile:
            reader = csv.DictReader(csvfile)
            
            for row in reader:
                cleaned_row = clean_data(row)
                
                # Only add rows with required fields
                if cleaned_row.get('date_coded'):
                    
                    try:
                        result = supabase.table('spend_summary').upsert(
                            cleaned_row,
                            on_conflict='date_coded'
                        ).execute()
                        
                        total_rows += 1
                        logger.info(f"Inserted row {total_rows}: {cleaned_row.get('date_coded')}")
                        
                    except Exception as e:
                        logger.warning(f"Failed to insert row {cleaned_row.get('date_coded')}: {e}")
        
        logger.info(f"✅ Import completed successfully! Total rows: {total_rows}")
        return True
        
    except Exception as e:
        logger.error(f"Error during import: {e}")
        return False

def main():
    if len(sys.argv) != 2:
        print("Usage: python3 import-spend-summary-supabase.py /path/to/your/file.csv")
        print("\nFirst, create the table by running the SQL in your Supabase SQL editor.")
        sys.exit(1)
    
    csv_file_path = sys.argv[1]
    
    # First create the table
    print("Creating table structure...")
    create_table()
    print("\n⚠️  Please run the SQL above in your Supabase SQL editor first!")
    print("Then run this script again to import the data.")
    
    # Ask if user wants to proceed with import
    proceed = input("\nHave you created the table? (y/n): ").strip().lower()
    if proceed != 'y':
        print("Exiting. Please create the table first.")
        sys.exit(0)
    
    # Import the data
    success = import_csv(csv_file_path)
    
    if success:
        print("\n🎉 Spend summary import completed successfully!")
        print("You can now use this data in your dashboard.")
    else:
        print("\n❌ Import failed.")
        print("Make sure the table has been created first.")

if __name__ == "__main__":
    main()
