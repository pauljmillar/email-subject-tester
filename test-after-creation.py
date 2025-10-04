import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')

def test_after_creation():
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    if not all([supabase_url, supabase_key]):
        print('Error: Missing required environment variables')
        sys.exit(1)

    supabase: Client = create_client(supabase_url, supabase_key)

    print('🧪 Testing run_query function after manual creation...')
    
    try:
        print('Test: Simple SELECT query...')
        response = supabase.rpc('run_query', {'sql': 'SELECT subject_line, company FROM subject_lines LIMIT 3'})
        result = response.execute()
        
        print(f'✅ Function works!')
        print(f'Result: {result}')
        
        if hasattr(result, 'data'):
            print(f'Data: {result.data}')
            print(f'Number of rows: {len(result.data) if result.data else 0}')
        if hasattr(result, 'error'):
            print(f'Error: {result.error}')
            
    except Exception as e:
        print(f'❌ Function test failed: {e}')
        print('\\nPlease make sure you created the function in Supabase SQL editor first!')

if __name__ == '__main__':
    test_after_creation()
