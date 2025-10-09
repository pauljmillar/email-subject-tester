import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function GET() {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    console.log('Fetching all industries...');

    const { data, error } = await supabase
      .from('subject_lines')
      .select('sub_industry')
      .not('sub_industry', 'is', null);

    if (error) {
      console.error('Error fetching industries:', error);
      return NextResponse.json(
        { error: 'Failed to fetch industries' },
        { status: 500 }
      );
    }

    // Get unique industries
    const industries = [...new Set(data?.map(row => row.sub_industry) || [])].sort();
    
    console.log(`Found ${industries.length} industries`);

    return NextResponse.json({ industries });

  } catch (error) {
    console.error('Industries API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch industries' },
      { status: 500 }
    );
  }
}
