#!/usr/bin/env python3
"""
Script to deploy the new search function to Supabase.
"""

import os
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

def deploy_search_function():
    """Deploy the new search function to Supabase."""
    
    # Initialize Supabase client
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
    
    if not supabase_url or not supabase_key:
        print("Error: Missing Supabase environment variables")
        return
    
    supabase: Client = create_client(supabase_url, supabase_key)
    
    # Read the SQL file
    with open('new-search-function.sql', 'r') as f:
        sql_content = f.read()
    
    print("Deploying new search function...")
    
    try:
        # Execute the SQL
        result = supabase.rpc('exec_sql', {'sql': sql_content}).execute()
        print("✅ Search function deployed successfully!")
        
    except Exception as e:
        print(f"❌ Error deploying search function: {e}")
        
        # Try alternative approach - execute SQL directly
        try:
            # Split SQL into individual statements and execute them
            statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
            
            for statement in statements:
                if statement:
                    print(f"Executing: {statement[:50]}...")
                    supabase.rpc('exec_sql', {'sql': statement}).execute()
            
            print("✅ Search function deployed successfully!")
            
        except Exception as e2:
            print(f"❌ Alternative deployment also failed: {e2}")
            print("You may need to manually execute the SQL in the Supabase dashboard.")

if __name__ == "__main__":
    deploy_search_function()
