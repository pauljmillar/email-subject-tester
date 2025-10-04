import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')

def update_function():
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    if not all([supabase_url, supabase_key]):
        print('Error: Missing required environment variables')
        sys.exit(1)

    supabase: Client = create_client(supabase_url, supabase_key)

    print('🔧 Updating run_query function with correct schema...')
    
    # Read the SQL file
    with open('update-function.sql', 'r') as f:
        sql_content = f.read()
    
    print('SQL to execute:')
    print(sql_content)
    print('\nPlease run this SQL in your Supabase SQL editor to update the function.')
    
    # Try to execute it via RPC (might not work)
    try:
        response = supabase.rpc('exec_sql', {'sql': sql_content})
        result = response.execute()
        print(f'✅ Function updated via API: {result}')
    except Exception as e:
        print(f'❌ API update failed (expected): {e}')
        print('\nPlease run the SQL manually in Supabase SQL editor.')

if __name__ == '__main__':
    update_function()
