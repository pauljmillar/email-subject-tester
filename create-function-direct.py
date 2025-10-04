import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv('.env.local')

def create_function_direct():
    supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
    supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

    if not all([supabase_url, supabase_key]):
        print('Error: Missing required environment variables')
        sys.exit(1)

    supabase: Client = create_client(supabase_url, supabase_key)

    print('🔧 Attempting to create run_query function directly...')
    
    # Try different approaches to create the function
    approaches = [
        {
            'name': 'Direct RPC call',
            'method': lambda: supabase.rpc('exec_sql', {'sql': create_function_sql})
        },
        {
            'name': 'Using exec function',
            'method': lambda: supabase.rpc('exec', {'sql': create_function_sql})
        },
        {
            'name': 'Using execute function',
            'method': lambda: supabase.rpc('execute', {'sql': create_function_sql})
        }
    ]
    
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
    
    for approach in approaches:
        try:
            print(f'\\nTrying {approach["name"]}...')
            response = approach['method']()
            print(f'✅ {approach["name"]} succeeded: {response}')
            return True
        except Exception as e:
            print(f'❌ {approach["name"]} failed: {e}')
    
    print('\\n❌ All approaches failed. Manual SQL execution required.')
    print('\\nPlease run this SQL in your Supabase SQL editor:')
    print(create_function_sql)
    return False

if __name__ == '__main__':
    create_function_direct()
