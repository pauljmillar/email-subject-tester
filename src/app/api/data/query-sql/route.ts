import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export async function POST(request: NextRequest) {
  try {
    const { sql } = await request.json();
    
    console.log('=== SQL QUERY API DEBUG ===');
    console.log('SQL:', sql);

    if (!sql) {
      return NextResponse.json({ error: 'SQL statement is required' }, { status: 400 });
    }

    // Security: Block dangerous SQL statements
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

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Execute the SQL using the run_query function
    let data;
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

    console.log('=== END SQL QUERY API DEBUG ===');

    // Format the results into context text
    let contextText = '';
    if (data && data.length > 0) {
      contextText = '\n\nHere are the results from our database:\n';
      data.forEach((row: any, index: number) => {
        contextText += `${index + 1}. `;
        
        // Handle JSONB result format
        const resultData = row.result || row;
        
        // Format based on available fields
        if (resultData.subject_line) {
          contextText += `"${resultData.subject_line}"`;
          if (resultData.open_rate) contextText += ` (Open Rate: ${(resultData.open_rate * 100).toFixed(1)}%)`;
          if (resultData.company) contextText += `, Company: ${resultData.company}`;
          if (resultData.projected_volume) contextText += `, Volume: ${resultData.projected_volume.toLocaleString()}`;
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

    return NextResponse.json({ contextText, sql, rowCount: data?.length || 0 });

  } catch (error) {
    console.error('SQL Query API error:', error);
    return NextResponse.json({ error: 'Failed to execute query' }, { status: 500 });
  }
}
