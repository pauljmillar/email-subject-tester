import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')

def test_run_query():
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    if not all([supabase_url, supabase_key]):
        print('Error: Missing required environment variables')
        sys.exit(1)

    supabase: Client = create_client(supabase_url, supabase_key)

    print('🧪 Testing run_query function...')
    
    # Test 1: Simple query
    try:
        print('Test 1: Simple SELECT query...')
        response = supabase.rpc('run_query', {'sql': 'SELECT subject_line, company FROM subject_lines LIMIT 3'})
        print(f'Response type: {type(response)}')
        print(f'Response: {response}')
        
        # Try to get the actual data
        if hasattr(response, 'data'):
            print(f'Data: {response.data}')
        else:
            print('No data attribute - this is a query builder')
            
    except Exception as e:
        print(f'Test 1 failed: {e}')
    
    # Test 2: Try to execute the query builder
    try:
        print('\\nTest 2: Trying to execute query builder...')
        response = supabase.rpc('run_query', {'sql': 'SELECT subject_line, company FROM subject_lines LIMIT 3'})
        
        # Try different ways to get the data
        print(f'Response object: {response}')
        print(f'Response dir: {dir(response)}')
        
        # Try calling it
        try:
            result = response()
            print(f'Called result: {result}')
        except Exception as e:
            print(f'Call failed: {e}')
            
    except Exception as e:
        print(f'Test 2 failed: {e}')

if __name__ == '__main__':
    test_run_query()
