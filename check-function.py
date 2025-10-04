import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')

def check_postgres_function():
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    if not all([supabase_url, supabase_key]):
        print('Error: Missing required environment variables')
        sys.exit(1)

    supabase: Client = create_client(supabase_url, supabase_key)

    print('🔍 Checking if run_query function exists in database...')
    
    # Check if the function exists by querying the information schema
    try:
        print('Checking function existence...')
        # Query to check if run_query function exists
        check_sql = """
        SELECT routine_name, routine_type 
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'run_query'
        """
        
        # Try to execute this via a direct query
        response = supabase.from_('information_schema.routines').select('routine_name, routine_type').eq('routine_schema', 'public').eq('routine_name', 'run_query')
        
        print(f'Function check response: {response}')
        
    except Exception as e:
        print(f'Function check failed: {e}')
    
    # Try to create the function if it doesn't exist
    try:
        print('Attempting to create run_query function...')
        
        create_function_sql = """
        CREATE OR REPLACE FUNCTION run_query(sql text)
        RETURNS TABLE(
          subject_line text,
          company text,
          sub_industry text,
          open_rate float,
          projected_volume bigint,
          date_sent date,
          campaign_name text,
          description text
        )
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        BEGIN
          RETURN QUERY EXECUTE sql;
        END;
        $$;
        """
        
        print('Function creation SQL:')
        print(create_function_sql)
        print('\nPlease run this SQL manually in your Supabase SQL editor.')
        
    except Exception as e:
        print(f'Function creation failed: {e}')

if __name__ == '__main__':
    check_postgres_function()
