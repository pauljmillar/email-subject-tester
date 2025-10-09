import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

interface IntentFacet {
  type: 'subject_line' | 'volume' | 'open_rates';
  parameters?: {
    company?: string[];
    industry?: string[];
    timeframe?: string;
  };
  subject_line?: string;
  sql?: string;
}

interface IntentResponse {
  intent: string;
  facets: IntentFacet[];
}

export async function POST(request: NextRequest) {
  try {
    const { intentResponse, originalSubjectLine } = await request.json();
    
    console.log('=== GATHER API DEBUG ===');
    console.log('Intent response:', JSON.stringify(intentResponse, null, 2));
    console.log('Number of facets to process:', intentResponse.facets?.length || 0);

    if (!intentResponse || !intentResponse.facets) {
      return NextResponse.json(
        { error: 'Intent response with facets is required' },
        { status: 400 }
      );
    }

    let contextText = '';

    if (intentResponse.facets && intentResponse.facets.length > 0) {
      // Execute queries for each facet in parallel
      const queryPromises = intentResponse.facets.map(async (facet: IntentFacet, index: number) => {
        console.log(`Executing query for facet ${index + 1}:`, facet.type);
        
        try {
          // Use SQL query if available, otherwise fall back to simple query
          let response;
          if (facet.sql) {
            response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/data/query-sql`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sql: facet.sql,
                subject_line: facet.subject_line // Pass subject_line for vector search
              }),
            });
          } else {
            // For subject_line facets without SQL, use vector search with disclaimer
            response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/data/query-sql`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sql: '', // Empty SQL for vector search
                subject_line: facet.subject_line || originalSubjectLine,
                company_filter: facet.parameters?.company || []
              }),
            });
          }

          if (response.ok) {
            const data = await response.json();
            console.log(`Query result for ${facet.type}:`, data);
            console.log(`Context text length for ${facet.type}:`, data.contextText?.length || 0);
            
            return data.contextText || '';
          } else {
            const errorText = await response.text();
            console.error(`Query failed for ${facet.type}:`, errorText);
            return '';
          }
        } catch (error) {
          console.error(`Error executing query for ${facet.type}:`, error);
          return '';
        }
      });

      const results = await Promise.all(queryPromises);
      contextText = results.filter(text => text && text.trim()).join('\n\n');
      
      // Debug: Show query results
      console.log('Query results summary:');
      results.forEach((result, index) => {
        if (result && result.trim()) {
          const lines = result.split('\n').filter((line: string) => line.trim().length > 0);
          const recordCount = lines.filter((line: string) => line.match(/^\d+\./)).length;
          console.log(`• Facet ${index + 1}: Found ${recordCount} records`);
        } else {
          console.log(`• Facet ${index + 1}: No records found`);
        }
      });
    }

    console.log('Final context text length:', contextText.length);
    console.log('=== END GATHER API DEBUG ===');

    return NextResponse.json({ 
      contextText,
      facetCount: intentResponse.facets?.length || 0,
      successCount: contextText ? contextText.split('\n\n').length : 0
    });

  } catch (error) {
    console.error('Gather API error:', error);
    return NextResponse.json(
      { error: 'Failed to gather data' },
      { status: 500 }
    );
  }
}
