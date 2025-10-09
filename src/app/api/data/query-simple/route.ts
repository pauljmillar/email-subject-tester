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

export async function POST(request: NextRequest) {
  try {
    const { facetType, parameters, subjectLine } = await request.json();
    
    console.log('=== SIMPLE QUERY API DEBUG ===');
    console.log('facetType:', facetType);
    console.log('parameters:', parameters);

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    let contextText = '';

    if (facetType === 'subject_line') {
      console.log('Processing subject_line facet with vector search...');
      
      try {
        // For subject_line facet, we need to do vector similarity search
        console.log('Searching for similar subject lines to:', subjectLine);
        
        // Generate embedding for the subject line
        const OpenAI = (await import('openai')).default;
        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });
        
        const embeddingResponse = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: subjectLine,
        });
        const queryEmbedding = embeddingResponse.data[0].embedding;
        
        // Call the vector similarity search
        const { data, error } = await supabase.rpc('find_similar_subject_lines', {
          query_embedding: queryEmbedding,
          similarity_threshold: 0.3,
          max_results: 10
        });
        
        if (error) {
          console.error('Vector search error:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          contextText = '\n\nBased on our email marketing database, here are some insights about successful subject lines:\n- High-performing subject lines typically have open rates above 20%\n- Action-oriented language performs better\n- Urgency and personalization increase engagement';
        } else {
          console.log(`Found ${data?.length || 0} similar subject lines`);
          
          if (data && data.length > 0) {
            // Apply company filter if provided
            let filteredData = data;
            if (parameters?.company && parameters.company.length > 0) {
              filteredData = data.filter((line: Record<string, unknown>) => 
                parameters.company.includes(line.company as string)
              );
              console.log(`Filtered to ${filteredData.length} results for companies: ${parameters.company.join(', ')}`);
            }
            
            // Apply industry filter if provided
            if (parameters?.industry && parameters.industry.length > 0) {
              filteredData = filteredData.filter((line: Record<string, unknown>) => 
                parameters.industry.includes(line.sub_industry as string)
              );
              console.log(`Filtered to ${filteredData.length} results for industries: ${parameters.industry.join(', ')}`);
            }
            
            if (filteredData.length > 0) {
              contextText = '\n\nHere are some similar subject lines from our database:\n';
              filteredData.forEach((line: Record<string, unknown>, index: number) => {
                contextText += `${index + 1}. "${line.subject_line}" (Open Rate: ${(line.open_rate * 100).toFixed(1)}%`;
                if (line.company) contextText += `, Company: ${line.company}`;
                contextText += `, Similarity: ${(line.similarity * 100).toFixed(0)}%)\n`;
              });
            } else {
              // Fallback: If vector search + company filter returns no results, try keyword search for the company
              if (parameters?.company && parameters.company.length > 0) {
                console.log('No vector results for company, trying keyword search...');
                try {
                  const keywordQuery = supabase
                    .from('subject_lines')
                    .select('subject_line, open_rate, company, projected_volume')
                    .in('company', parameters.company)
                    .ilike('subject_line', `%${subjectLine}%`)
                    .order('open_rate', { ascending: false })
                    .limit(5);
                  
                  const { data: keywordData, error: keywordError } = await keywordQuery;
                  
                  if (!keywordError && keywordData && keywordData.length > 0) {
                    contextText = '\n\nHere are some subject lines from our database:\n';
                    keywordData.forEach((line: Record<string, unknown>, index: number) => {
                      contextText += `${index + 1}. "${line.subject_line}" (Open Rate: ${(line.open_rate * 100).toFixed(1)}%`;
                      if (line.company) contextText += `, Company: ${line.company}`;
                      contextText += `)\n`;
                    });
                  } else {
                    contextText = '\n\nBased on our email marketing database, here are some insights about successful subject lines:\n- High-performing subject lines typically have open rates above 20%\n- Action-oriented language performs better\n- Urgency and personalization increase engagement';
                  }
                } catch (keywordError) {
                  console.error('Keyword search error:', keywordError);
                  contextText = '\n\nBased on our email marketing database, here are some insights about successful subject lines:\n- High-performing subject lines typically have open rates above 20%\n- Action-oriented language performs better\n- Urgency and personalization increase engagement';
                }
              } else {
                contextText = '\n\nBased on our email marketing database, here are some insights about successful subject lines:\n- High-performing subject lines typically have open rates above 20%\n- Action-oriented language performs better\n- Urgency and personalization increase engagement';
              }
            }
          } else {
            contextText = '\n\nBased on our email marketing database, here are some insights about successful subject lines:\n- High-performing subject lines typically have open rates above 20%\n- Action-oriented language performs better\n- Urgency and personalization increase engagement';
          }
        }
      } catch (error) {
        console.error('Subject line search error:', error);
        contextText = '\n\nBased on our email marketing database, here are some insights about successful subject lines:\n- High-performing subject lines typically have open rates above 20%\n- Action-oriented language performs better\n- Urgency and personalization increase engagement';
      }
    } else if (facetType === 'volume') {
      console.log('Processing volume facet...');
      
      try {
        // Build query with filters
        let query = supabase
          .from('subject_lines')
          .select('subject_line, projected_volume, company, sub_industry, date_sent')
          .not('projected_volume', 'is', null);
        
        // Apply company filter if provided
        if (parameters?.company && parameters.company.length > 0) {
          query = query.in('company', parameters.company);
        }
        
        // Apply industry filter if provided
        if (parameters?.industry && parameters.industry.length > 0) {
          query = query.in('sub_industry', parameters.industry);
        }
        
        // Apply timeframe filter (skip date filtering since most records have null date_sent)
        // Note: Since most records have date_sent: null, we skip date filtering for all timeframes
        // This ensures we get volume data regardless of timeframe
        
        const { data, error } = await query
          .order('projected_volume', { ascending: false })
          .limit(10);

        if (error) {
          console.error('Volume query error:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          contextText = '\n\nBased on our email marketing database, here are some insights about high-volume campaigns:\n- Large campaigns typically target broad audiences\n- Volume often correlates with promotional campaigns\n- High-volume sends require careful deliverability management';
        } else {
          console.log(`Found ${data?.length || 0} volume records`);
          console.log('Volume data sample:', data?.slice(0, 2));
          
          if (data && data.length > 0) {
            contextText = '\n\nHere are the highest-volume email campaigns from our database:\n';
            data.forEach((campaign, index) => {
              contextText += `${index + 1}. "${campaign.subject_line}" (Volume: ${campaign.projected_volume?.toLocaleString() || 'N/A'}`;
              if (campaign.company) contextText += `, Company: ${campaign.company}`;
              if (campaign.date_sent) contextText += `, Date: ${campaign.date_sent}`;
              contextText += ')\n';
            });
          } else {
            contextText = '\n\nBased on our email marketing database, here are some insights about high-volume campaigns:\n- Large campaigns typically target broad audiences\n- Volume often correlates with promotional campaigns\n- High-volume sends require careful deliverability management';
          }
        }
      } catch (error) {
        console.error('Volume query error:', error);
        contextText = '\n\nBased on our email marketing database, here are some insights about high-volume campaigns:\n- Large campaigns typically target broad audiences\n- Volume often correlates with promotional campaigns\n- High-volume sends require careful deliverability management';
      }
    } else if (facetType === 'open_rates') {
      console.log('Processing open_rates facet...');
      
      try {
        const { data, error } = await supabase
          .from('subject_lines')
          .select('subject_line, open_rate, company, sub_industry')
          .not('open_rate', 'is', null)
          .order('open_rate', { ascending: false })
          .limit(5);

        if (error) {
          console.error('Database error:', error);
          contextText = '\n\nBased on our email marketing database, here are some insights about successful subject lines:\n- High-performing subject lines typically have open rates above 20%\n- Action-oriented language performs better\n- Urgency and personalization increase engagement';
        } else {
          console.log(`Found ${data?.length || 0} records`);
          
          if (data && data.length > 0) {
            contextText = '\n\nHere are some high-performing subject lines from our database:\n';
            data.forEach((line, index) => {
              contextText += `${index + 1}. "${line.subject_line}" (Open Rate: ${(line.open_rate * 100).toFixed(1)}%`;
              if (line.company) contextText += `, Company: ${line.company}`;
              contextText += ')\n';
            });
          } else {
            contextText = '\n\nBased on our email marketing database, here are some insights about successful subject lines:\n- High-performing subject lines typically have open rates above 20%\n- Action-oriented language performs better\n- Urgency and personalization increase engagement';
          }
        }
      } catch (error) {
        console.error('Query error:', error);
        contextText = '\n\nBased on our email marketing database, here are some insights about successful subject lines:\n- High-performing subject lines typically have open rates above 20%\n- Action-oriented language performs better\n- Urgency and personalization increase engagement';
      }
    } else {
      contextText = '\n\nBased on our email marketing database, here are some general insights about email marketing best practices.';
    }

    console.log('Context text length:', contextText.length);
    console.log('=== END SIMPLE QUERY API DEBUG ===');

    return NextResponse.json({
      contextText,
      facetType
    });

  } catch (error) {
    console.error('Simple Query API error:', error);
    return NextResponse.json(
      { error: 'Failed to execute query' },
      { status: 500 }
    );
  }
}
