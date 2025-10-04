import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')

def test_run_query_execute():
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    if not all([supabase_url, supabase_key]):
        print('Error: Missing required environment variables')
        sys.exit(1)

    supabase: Client = create_client(supabase_url, supabase_key)

    print('🧪 Testing run_query function with execute()...')
    
    try:
        print('Test: Simple SELECT query with execute()...')
        response = supabase.rpc('run_query', {'sql': 'SELECT subject_line, company FROM subject_lines LIMIT 3'})
        
        # Try to execute the query builder
        result = response.execute()
        print(f'Execute result: {result}')
        print(f'Result type: {type(result)}')
        
        if hasattr(result, 'data'):
            print(f'Data: {result.data}')
        if hasattr(result, 'error'):
            print(f'Error: {result.error}')
            
    except Exception as e:
        print(f'Execute test failed: {e}')
        print(f'Error type: {type(e)}')
        print(f'Error details: {str(e)}')

if __name__ == '__main__':
    test_run_query_execute()
