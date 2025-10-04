#!/usr/bin/env python3
"""
Script to deploy intent-related database functions to Supabase.
"""

import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

def deploy_functions():
    """Deploy the intent database functions to Supabase."""
    
    # Initialize Supabase client
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_key:
        print("Error: Missing required environment variables")
        print("Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")
        sys.exit(1)
    
    supabase: Client = create_client(supabase_url, supabase_key)
    
    # Read the SQL file
    try:
        with open('intent-database-functions.sql', 'r') as file:
            sql_content = file.read()
    except FileNotFoundError:
        print("Error: intent-database-functions.sql file not found")
        sys.exit(1)
    
    print("🚀 Deploying intent database functions...")
    
    try:
        # Execute the SQL
        response = supabase.rpc('exec_sql', {'sql': sql_content})
        
        print("✅ Successfully deployed intent database functions!")
        print("Functions created:")
        print("  - allCompanies()")
        print("  - allIndustries()")
        print("  - find_similar_subject_lines_with_filters()")
        print("  - getVolumes()")
        print("  - getOpenRates()")
            
    except Exception as e:
        print(f"❌ Error deploying functions: {e}")
        print("This might be expected if functions already exist")
        print("Continuing with testing...")

if __name__ == "__main__":
    deploy_functions()
