import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 API CALLED - query-sql route');
        const requestBody = await request.json();
        const { sql, subject_line: subjectLineParam, company_filter } = requestBody;
    
    console.log('=== SQL QUERY API DEBUG ===');
    console.log('Full request body:', JSON.stringify(requestBody, null, 2));
    console.log('SQL:', sql);
    console.log('Subject Line Param:', subjectLineParam);

    if (!sql && !subjectLineParam) {
      return NextResponse.json({ error: 'SQL statement is required' }, { status: 400 });
    }

    // Security: Block dangerous SQL statements (only if SQL is provided)
    if (sql && sql.trim()) {
      const dangerousKeywords = [
        'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE', 'ALTER', 'TRUNCATE',
        'GRANT', 'REVOKE', 'EXEC', 'EXECUTE', 'CALL', 'MERGE', 'UPSERT',
        '--', '/*', '*/', ';', 'UNION', 'UNION ALL'
      ];
      
      const upperSql = sql.toUpperCase().trim();
      
      // Check for dangerous keywords
      for (const keyword of dangerousKeywords) {
        if (upperSql.includes(keyword)) {
          console.error('Blocked dangerous SQL:', sql);
          return NextResponse.json({ 
            error: 'Dangerous SQL statement blocked', 
            details: `The SQL contains forbidden keyword: ${keyword}` 
          }, { status: 403 });
        }
      }
      
      // Only allow SELECT statements
      if (!upperSql.startsWith('SELECT')) {
        console.error('Blocked non-SELECT SQL:', sql);
        return NextResponse.json({ 
          error: 'Only SELECT statements are allowed', 
          details: 'The SQL must start with SELECT' 
        }, { status: 403 });
      }
      
      // Additional security: Block system tables and functions
      const systemPatterns = [
        'INFORMATION_SCHEMA', 'PG_', 'SYS.', 'SYSTEM.', 'MYSQL.', 'SQLITE_',
        'SP_', 'XP_', 'DBCC', 'BULK', 'BACKUP', 'RESTORE'
      ];
      
      for (const pattern of systemPatterns) {
        if (upperSql.includes(pattern)) {
          console.error('Blocked system access SQL:', sql);
          return NextResponse.json({ 
            error: 'System access blocked', 
            details: `The SQL contains forbidden system pattern: ${pattern}` 
          }, { status: 403 });
        }
      }
      
      // Limit query length to prevent DoS
      if (sql.length > 10000) {
        console.error('Blocked oversized SQL:', sql.length);
        return NextResponse.json({ 
          error: 'SQL query too long', 
          details: 'Maximum query length is 10,000 characters' 
        }, { status: 413 });
      }
    }

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    let data;
    
    if (subjectLineParam) {
      console.log('✅ VECTOR SEARCH TRIGGERED - subjectLineParam:', subjectLineParam);
      
      try {
        // Generate embedding for the subject line
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: subjectLineParam,
            model: 'text-embedding-3-small'
          })
        });
        
        if (!embeddingResponse.ok) {
          throw new Error('Failed to generate embedding');
        }
        
        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data[0].embedding;
        
                // Perform vector similarity search
                const { data: vectorData, error: vectorError } = await supabase.rpc('find_similar_subject_lines', {
                  query_embedding: embedding,
                  similarity_threshold: 0.0, // Zero threshold to get all results
                  max_results: 10
                });
        
        if (vectorError) {
          console.error('Vector search error:', vectorError);
          // Fallback to regular SQL
          const result = await supabase.rpc('run_query', { sql });
          data = result.data;
        } else {
          data = vectorData;
          console.log('Vector similarity search executed successfully');
          console.log('Result rows:', data?.length || 0);
          console.log('Vector search results:', JSON.stringify(data, null, 2));
          console.log('Data type:', typeof data);
          console.log('Data is array:', Array.isArray(data));
          
          // If vector search returns no results, try keyword search as fallback
          if (!data || data.length === 0) {
            console.log('No vector results, trying keyword search fallback...');
            try {
              const keywordQuery = supabase
                .from('subject_lines')
                .select('subject_line, open_rate, company, projected_volume, date_sent')
                .ilike('subject_line', `%${subjectLineParam}%`)
                .order('open_rate', { ascending: false })
                .limit(10);
              
              const { data: keywordData, error: keywordError } = await keywordQuery;
              
              if (!keywordError && keywordData && keywordData.length > 0) {
                console.log(`Keyword search found ${keywordData.length} results`);
                data = keywordData;
              } else {
                console.log('Keyword search also returned no results');
                data = [];
              }
            } catch (keywordError) {
              console.error('Keyword search error:', keywordError);
              data = [];
            }
          } else {
            // Vector search returned results, but also try keyword search to supplement
            console.log('Vector search returned results, also trying keyword search to supplement...');
            try {
              const keywordQuery = supabase
                .from('subject_lines')
                .select('subject_line, open_rate, company, projected_volume, date_sent')
                .ilike('subject_line', `%${subjectLineParam}%`)
                .order('open_rate', { ascending: false })
                .limit(5);
              
              const { data: keywordData, error: keywordError } = await keywordQuery;
              
              if (!keywordError && keywordData && keywordData.length > 0) {
                console.log(`Keyword search found ${keywordData.length} additional results`);
                // Combine vector and keyword results, removing duplicates
                const combinedData = [...data];
                keywordData.forEach((keywordResult: Record<string, unknown>) => {
                  if (!combinedData.some((vectorResult: Record<string, unknown>) => 
                    vectorResult.subject_line === keywordResult.subject_line
                  )) {
                    combinedData.push(keywordResult);
                  }
                });
                data = combinedData.slice(0, 10); // Limit to 10 total results
                console.log(`Combined results: ${data.length} total`);
              } else {
                console.log('Keyword search returned no additional results');
              }
            } catch (keywordError) {
              console.error('Keyword search error:', keywordError);
              // Continue with vector results only
            }
          }
        }
        
      } catch (vectorError) {
        console.error('Vector search failed, falling back to regular SQL:', vectorError);
        // Fallback to regular SQL execution
        const result = await supabase.rpc('run_query', { sql });
        data = result.data;
      }
    } else {
      // Regular SQL execution
      try {
        const result = await supabase.rpc('run_query', { sql });
        
        if (result.error) {
          console.error('SQL execution error:', result.error);
          console.error('Error details:', JSON.stringify(result.error, null, 2));
          return NextResponse.json({ error: 'Failed to execute SQL query', details: result.error }, { status: 500 });
        }
        
        data = result.data;
        console.log('SQL query executed successfully');
        console.log('Result rows:', data?.length || 0);
        console.log('Sample data:', data?.[0]);
      } catch (executionError) {
        console.error('SQL execution exception:', executionError);
        return NextResponse.json({ error: 'SQL execution failed', details: executionError }, { status: 500 });
      }
    }

    console.log('=== END SQL QUERY API DEBUG ===');

            // Format the results into context text
            let contextText = '';
            if (data && data.length > 0) {
              // Check if we need to add a disclaimer for company mismatch
              
              let hasMatchingCompany = false;
              if (company_filter && company_filter.length > 0) {
                hasMatchingCompany = data.some((row: Record<string, unknown>) => {
                  const resultData = row.result || row;
                  return company_filter.includes(resultData.company);
                });
              }
              
              if (company_filter && company_filter.length > 0 && !hasMatchingCompany) {
                contextText = `\n\nWe found these results but they do not match the company filter (${company_filter.join(', ')}):\n`;
              } else {
                contextText = '\n\nHere are the results from our database:\n';
              }
              
              data.forEach((row: Record<string, unknown>, index: number) => {
                contextText += `${index + 1}. `;
                
                // Handle different result formats
                let resultData;
                if (row.result) {
                  // JSONB format from regular SQL
                  resultData = row.result;
                } else if (row.subject_line) {
                  // Direct format from vector search
                  resultData = row;
                } else {
                  // Fallback
                  resultData = row;
                }
                
                console.log(`Formatting row ${index + 1}:`, resultData);
                
                // Format based on available fields
                if (resultData.subject_line) {
                  contextText += `"${resultData.subject_line}"`;
                  if (resultData.open_rate) contextText += ` (Open Rate: ${(resultData.open_rate * 100).toFixed(1)}%)`;
                  if (resultData.company) contextText += `, Company: ${resultData.company}`;
                  if (resultData.projected_volume) contextText += `, Volume: ${resultData.projected_volume.toLocaleString()}`;
                  if (resultData.date_sent) contextText += `, Date: ${resultData.date_sent}`;
                  if (resultData.similarity) contextText += `, Similarity: ${(resultData.similarity * 100).toFixed(1)}%`;
                } else if (resultData.company && resultData.projected_volume) {
                  contextText += `Company: ${resultData.company}, Volume: ${resultData.projected_volume.toLocaleString()}`;
                } else if (resultData.month && resultData.total_volume) {
                  // Handle aggregate queries with month and volume
                  const monthNames = ['', 'January', 'February', 'March', 'April', 'May', 'June', 
                                     'July', 'August', 'September', 'October', 'November', 'December'];
                  contextText += `Month: ${monthNames[resultData.month] || resultData.month}, Total Volume: ${resultData.total_volume.toLocaleString()}`;
                } else {
                  // Generic formatting for other fields
                  const fields = Object.entries(resultData).map(([key, value]) => `${key}: ${value}`).join(', ');
                  contextText += fields;
                }
                contextText += '\n';
              });
            } else {
              contextText = '\n\nNo records found matching the criteria.';
            }
    
    console.log('Final context text:', contextText);

    return NextResponse.json({ contextText, sql, rowCount: data?.length || 0 });

  } catch (error) {
    console.error('SQL Query API error:', error);
    return NextResponse.json({ error: 'Failed to execute query' }, { status: 500 });
  }
}
