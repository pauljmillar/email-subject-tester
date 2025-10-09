#!/usr/bin/env python3

import os
from supabase import create_client, Client

# Load environment variables
supabase_url = os.getenv('NEXT_PUBLIC_SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')

if not supabase_url or not supabase_key:
    print("❌ Missing Supabase credentials")
    exit(1)

# Create Supabase client
supabase: Client = create_client(supabase_url, supabase_key)

# Read the SQL function
with open('create-vector-function.sql', 'r') as f:
    sql_function = f.read()

print("📝 Deploying find_similar_subject_lines function...")

try:
    # Execute the SQL function creation
    result = supabase.rpc('exec_sql', {'sql': sql_function})
    
    if result.data:
        print("✅ Function created successfully!")
        print("Result:", result.data)
    else:
        print("❌ Function creation failed")
        print("Error:", result.error)
        
except Exception as e:
    print(f"❌ Error creating function: {e}")
    
    # Try alternative approach - direct SQL execution
    try:
        print("🔄 Trying alternative approach...")
        result = supabase.postgrest.rpc('exec_sql', {'sql': sql_function}).execute()
        print("✅ Function created with alternative approach!")
    except Exception as e2:
        print(f"❌ Alternative approach also failed: {e2}")
        print("\n📋 Manual deployment required:")
        print("1. Go to your Supabase dashboard")
        print("2. Navigate to SQL Editor")
        print("3. Copy and paste the contents of create-vector-function.sql")
        print("4. Execute the SQL")
