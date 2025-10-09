import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// import OpenAI from 'openai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    // const openai = new OpenAI({
    //   apiKey: process.env.OPENAI_API_KEY,
    // });

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function POST(request: NextRequest) {
  try {
    const { facetType, parameters, subjectLine } = await request.json();
    
    console.log('=== QUERY API DEBUG ===');
    console.log('facetType:', facetType);
    console.log('parameters:', parameters);
    console.log('subjectLine:', subjectLine);

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    let results: Record<string, unknown>[] = [];
    let contextText = '';

    if (facetType === 'subject_line' && subjectLine) {
      console.log('Processing subject_line facet with vector search...');
      
      // Generate embedding for the subject line
      // const embeddingResponse = await openai.embeddings.create({
      //   model: 'text-embedding-ada-002',
      //   input: subjectLine,
      // });

      // const queryEmbedding = embeddingResponse.data[0].embedding;

      // Build query with filters
      let query = supabase
        .from('subject_lines')
        .select(`
          id,
          subject_line,
          open_rate,
          company,
          sub_industry,
          date_sent,
          spam_rate,
          read_rate,
          inbox_rate
        `)
        .limit(10);

      // Apply filters
      if (parameters.company && parameters.company.length > 0) {
        query = query.in('company', parameters.company);
      }
      if (parameters.industry && parameters.industry.length > 0) {
        query = query.in('sub_industry', parameters.industry);
      }
      // Skip date filtering for now to avoid errors
      // TODO: Implement proper date filtering

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching subject lines:', error);
      } else {
        results = data || [];
        console.log(`Found ${results.length} subject lines`);
      }

      // Create context text
      if (results.length > 0) {
        contextText = '\n\nHere are some similar subject lines from our database:\n';
        results.forEach((line, index) => {
          contextText += `${index + 1}. "${line.subject_line}" (Open Rate: ${(line.open_rate * 100).toFixed(1)}%`;
          if (line.company) contextText += `, Company: ${line.company}`;
          if (line.sub_industry) contextText += `, Industry: ${line.sub_industry}`;
          contextText += ')\n';
        });
      }

    } else if (facetType === 'volume') {
      console.log('Processing volume facet...');
      
      let query = supabase
        .from('subject_lines')
        .select(`
          company,
          sub_industry,
          volume,
          avg_volume_per_campaign,
          date_sent,
          campaign_name,
          description,
          subject_line
        `)
        .not('volume', 'is', null)
        .order('volume', { ascending: false })
        .limit(10);

      // Apply filters
      if (parameters.company && parameters.company.length > 0) {
        query = query.in('company', parameters.company);
      }
      if (parameters.industry && parameters.industry.length > 0) {
        query = query.in('sub_industry', parameters.industry);
      }
      // Skip date filtering for now to avoid errors
      // TODO: Implement proper date filtering

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching volume data:', error);
      } else {
        results = data || [];
        console.log(`Found ${results.length} volume records`);
      }

      // Create context text
      if (results.length > 0) {
        contextText = '\n\nHere are some high-volume campaigns from our database:\n';
        results.forEach((line, index) => {
          contextText += `${index + 1}. ${line.company}: "${line.subject_line}" (Volume: ${line.volume}`;
          if (line.avg_volume_per_campaign) contextText += `, Avg: ${line.avg_volume_per_campaign}`;
          contextText += `)\n`;
        });
      }

    } else if (facetType === 'open_rates') {
      console.log('Processing open_rates facet...');
      
      let query = supabase
        .from('subject_lines')
        .select(`
          company,
          sub_industry,
          open_rate,
          subject_line,
          date_sent,
          spam_rate,
          read_rate,
          inbox_rate,
          mailing_type
        `)
        .not('open_rate', 'is', null)
        .order('open_rate', { ascending: false })
        .limit(10);

      // Apply filters
      if (parameters.company && parameters.company.length > 0) {
        query = query.in('company', parameters.company);
      }
      if (parameters.industry && parameters.industry.length > 0) {
        query = query.in('sub_industry', parameters.industry);
      }
      // Skip date filtering for now to avoid errors
      // TODO: Implement proper date filtering

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching open rates data:', error);
      } else {
        results = data || [];
        console.log(`Found ${results.length} open rate records`);
      }

      // Create context text
      if (results.length > 0) {
        contextText = '\n\nHere are some high-performing subject lines from our database:\n';
        results.forEach((line, index) => {
          contextText += `${index + 1}. "${line.subject_line}" (Open Rate: ${(line.open_rate * 100).toFixed(1)}%`;
          if (line.company) contextText += `, Company: ${line.company}`;
          if (line.sub_industry) contextText += `, Industry: ${line.sub_industry}`;
          contextText += ')\n';
        });
      }
    }

    console.log('Context text length:', contextText.length);
    console.log('=== END QUERY API DEBUG ===');

    return NextResponse.json({
      results,
      contextText,
      facetType
    });

  } catch (error) {
    console.error('Query API error:', error);
    return NextResponse.json(
      { error: 'Failed to execute query' },
      { status: 500 }
    );
  }
}
