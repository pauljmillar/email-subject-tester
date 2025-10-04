import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')

def debug_supabase_rpc():
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    if not all([supabase_url, supabase_key]):
        print('Error: Missing required environment variables')
        sys.exit(1)

    supabase: Client = create_client(supabase_url, supabase_key)

    print('🔍 Debugging Supabase RPC calls...')
    
    # Test 1: Check if we can call any RPC function
    try:
        print('Test 1: Checking available RPC functions...')
        # Let's try a simple function that might exist
        response = supabase.rpc('version')
        print(f'Version response: {response}')
    except Exception as e:
        print(f'Version test failed: {e}')
    
    # Test 2: Try to call run_query with different approaches
    try:
        print('Test 2: Trying run_query with different parameter names...')
        response = supabase.rpc('run_query', {'sql': 'SELECT 1 as test'})
        print(f'run_query response: {response}')
    except Exception as e:
        print(f'run_query failed: {e}')
    
    # Test 3: Check what RPC functions are available
    try:
        print('Test 3: Checking database connection...')
        # Try to get some basic info
        response = supabase.from_('subject_lines').select('*').limit(1)
        print(f'Basic query works: {response}')
    except Exception as e:
        print(f'Basic query failed: {e}')

if __name__ == '__main__':
    debug_supabase_rpc()
