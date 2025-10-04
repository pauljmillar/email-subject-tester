import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')

def create_function_proper():
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    if not all([supabase_url, supabase_key]):
        print('Error: Missing required environment variables')
        sys.exit(1)

    supabase: Client = create_client(supabase_url, supabase_key)

    print('🔧 Creating run_query function properly...')
    
    # The function creation SQL
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
    
    print('Attempting to create function via exec_sql...')
    
    try:
        # Try to execute the SQL creation
        response = supabase.rpc('exec_sql', {'sql': create_function_sql})
        print(f'exec_sql response: {response}')
        
        # Try to execute it
        result = response.execute()
        print(f'exec_sql execute result: {result}')
        
        if hasattr(result, 'data'):
            print(f'Data: {result.data}')
        if hasattr(result, 'error'):
            print(f'Error: {result.error}')
            
    except Exception as e:
        print(f'exec_sql failed: {e}')
    
    # Now test if the function was created
    print('\\nTesting if function was created...')
    try:
        test_response = supabase.rpc('run_query', {'sql': 'SELECT 1 as test'})
        test_result = test_response.execute()
        print(f'Function test result: {test_result}')
        
        if hasattr(test_result, 'data'):
            print(f'✅ Function works! Data: {test_result.data}')
        else:
            print(f'❌ Function test failed: {test_result}')
            
    except Exception as e:
        print(f'❌ Function test failed: {e}')
        print('\\nThe function was not created successfully.')
        print('\\nPlease run this SQL manually in your Supabase SQL editor:')
        print(create_function_sql)

if __name__ == '__main__':
    create_function_proper()
