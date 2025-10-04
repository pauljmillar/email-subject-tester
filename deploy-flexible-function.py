import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')

def deploy_flexible_function():
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    if not all([supabase_url, supabase_key]):
        print('Error: Missing required environment variables')
        sys.exit(1)

    supabase: Client = create_client(supabase_url, supabase_key)

    print('🔧 Deploying flexible run_query function...')
    
    # Read the SQL file
    with open('flexible-function.sql', 'r') as f:
        sql_content = f.read()
    
    print('SQL to execute:')
    print(sql_content)
    print('\nPlease run this SQL in your Supabase SQL editor to create the flexible function.')

if __name__ == '__main__':
    deploy_flexible_function()
