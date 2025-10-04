import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

interface IntentResponse {
  intent: string;
  facets: Array<{
    type: 'subject_line' | 'volume' | 'open_rates';
    parameters: {
      company?: string[];
      industry?: string[];
      timeframe?: string;
    };
    subject_line?: string;
    vector_search?: {
      query_embedding: number[];
      similarity_threshold: number;
      max_results: number;
    };
  }>;
}

export async function POST(request: NextRequest) {
  try {
    const { userPrompt, originalSubjectLine } = await request.json();
    
    console.log('=== INTENT API DEBUG ===');
    console.log('userPrompt:', userPrompt);
    console.log('originalSubjectLine:', originalSubjectLine);
    console.log('Available companies count:', availableCompanies.length);
    console.log('Available industries count:', availableIndustries.length);

    if (!userPrompt) {
      return NextResponse.json(
        { error: 'User prompt is required' },
        { status: 400 }
      );
    }

    if (!openai.apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Get available companies and industries for context
    let availableCompanies: string[] = [];
    let availableIndustries: string[] = [];

    if (supabase) {
      try {
        console.log('Fetching companies and industries from database...');
        
        // Get companies from database
        const companiesResult = await supabase
          .from('subject_lines')
          .select('company')
          .not('company', 'is', null)
          .limit(100)
          .execute();
        
        availableCompanies = [...new Set(companiesResult.data?.map(row => row.company) || [])];

        // Get industries from database
        const industriesResult = await supabase
          .from('subject_lines')
          .select('sub_industry')
          .not('sub_industry', 'is', null)
          .limit(100)
          .execute();
        
        availableIndustries = [...new Set(industriesResult.data?.map(row => row.sub_industry) || [])];

        console.log('Available companies:', availableCompanies.slice(0, 10));
        console.log('Available industries:', availableIndustries.slice(0, 10));
      } catch (error) {
        console.error('Error fetching companies/industries:', error);
        // Continue without this context
      }
    } else {
      console.log('Supabase not available, skipping database context');
    }

    // Create intent analysis prompt
    const intentPrompt = `You are an intent analysis system for an email marketing database. Analyze the user's request and determine what data would be most helpful.

Available companies: ${availableCompanies.slice(0, 20).join(', ')}
Available industries: ${availableIndustries.slice(0, 20).join(', ')}

User request: "${userPrompt}"
${originalSubjectLine ? `Original subject line being analyzed: "${originalSubjectLine}"` : ''}

Return a JSON response with this EXACT structure:
{
  "intent": "Clear description of what the user is trying to determine",
  "facets": [
    {
      "type": "subject_line|volume|open_rates",
      "parameters": {
        "company": ["Company1", "Company2"],
        "industry": ["Industry1", "Industry2"], 
        "timeframe": "recent|last 3 months|this year|etc"
      },
      "subject_line": "actual subject line here",
      "vector_search": {
        "query_embedding": "will be generated",
        "similarity_threshold": 0.7,
        "max_results": 10
      }
    }
  ]
}

Facet types:
- "subject_line": For similar subject lines, subject line analysis, examples
- "volume": For email volume, largest campaigns, biggest sends, high-volume campaigns  
- "open_rates": For successful campaigns, popular messages, good subject lines, engaged emails

Only include facets that are relevant. If no facets are needed, return {"intent": "...", "facets": []}.

Return ONLY valid JSON, no other text.`;

    console.log('Analyzing intent with OpenAI...');

    // Get intent analysis from OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an intent analysis system. Return only valid JSON responses.' },
        { role: 'user', content: intentPrompt }
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const intentResponseText = completion.choices[0]?.message?.content || '{}';
    console.log('Raw intent response from OpenAI:', intentResponseText);
    console.log('Response length:', intentResponseText.length);

    let intentResponse: IntentResponse;
    try {
      intentResponse = JSON.parse(intentResponseText);
    } catch (error) {
      console.error('Error parsing intent response:', error);
      // Fallback response
      intentResponse = {
        intent: "User is asking about email marketing",
        facets: []
      };
    }

    console.log('Parsed intent response:', JSON.stringify(intentResponse, null, 2));
    console.log('Number of facets:', intentResponse.facets?.length || 0);
    console.log('=== END INTENT API DEBUG ===');

    return NextResponse.json(intentResponse);

  } catch (error) {
    console.error('Intent API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze intent' },
      { status: 500 }
    );
  }
}
