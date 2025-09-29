import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Function to convert open rate to letter grade
function getOpenRateGrade(openRate: number): string {
  if (openRate >= 0.15) return 'A';
  if (openRate >= 0.10) return 'B';
  if (openRate >= 0.05) return 'C';
  if (openRate >= 0.02) return 'D';
  return 'F';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query || query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Use the custom function we created in the database
    const { data, error } = await supabase.rpc('search_subject_lines', {
      query: query
    });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to search subject lines' },
        { status: 500 }
      );
    }

    // Add grade to each result
    const results = data?.map((item: {
      subject_line: string;
      open_rate: number;
      similarity: number;
      score: number;
    }) => ({
      ...item,
      grade: getOpenRateGrade(item.open_rate),
      open_rate_percentage: (item.open_rate * 100).toFixed(1)
    })) || [];

    return NextResponse.json({ results });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
