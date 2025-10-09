import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

interface IntentFacet {
  type: 'spend_analysis' | 'company_comparison' | 'trend_analysis' | 'volume_analysis';
  parameters?: {
    companies?: string[];
    timeframe?: string;
    categories?: string[];
  };
  sql?: string;
}

interface IntentResponse {
  intent: string;
  facets: IntentFacet[];
}

export async function POST(request: NextRequest) {
  try {
    const { intentResponse, selectedCharts } = await request.json();
    
    console.log('=== CHIME GATHER API DEBUG ===');
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
          if (!supabase) {
            console.error('Supabase not configured');
            return '';
          }

          if (!facet.sql) {
            console.log(`No SQL query for facet ${index + 1}`);
            return '';
          }

          console.log(`Executing SQL for facet ${index + 1}:`, facet.sql);
          
          // Parse the SQL to extract the columns we need
          const sqlMatch = facet.sql.match(/SELECT\s+(.+?)\s+FROM/i);
          if (!sqlMatch) {
            console.log(`Could not parse SQL for facet ${index + 1}:`, facet.sql);
            return '';
          }
          
          const columns = sqlMatch[1].split(',').map(col => col.trim());
          console.log(`Extracted columns for facet ${index + 1}:`, columns);
          
          // Execute query with only the required columns
          const { data, error } = await supabase
            .from('spend_summary')
            .select(columns.join(','))
            .order('date_coded', { ascending: true });

          if (error) {
            console.error(`Query failed for ${facet.type}:`, error);
            return '';
          }

          if (!data || data.length === 0) {
            console.log(`No data returned for ${facet.type}`);
            return '';
          }

          // Format the data into context text
          let facetContext = `**${facet.type.toUpperCase()} DATA:**\n`;
          
          if (facet.type === 'spend_analysis') {
            // Show only the companies that were actually queried
            data.forEach((row: any, idx: number) => {
              facetContext += `${idx + 1}. `;
              if (row.date_coded) facetContext += `Date: ${row.date_coded}`;
              
              // Only show companies that were actually selected in the SQL query
              if (row.chime) facetContext += `, Chime: $${(row.chime / 1000000).toFixed(1)}M`;
              if (row.ally) facetContext += `, Ally: $${(row.ally / 1000000).toFixed(1)}M`;
              if (row.current) facetContext += `, Current: $${(row.current / 1000000).toFixed(1)}M`;
              if (row.one_finance) facetContext += `, One Finance: $${(row.one_finance / 1000000).toFixed(1)}M`;
              if (row.varo) facetContext += `, Varo: $${(row.varo / 1000000).toFixed(1)}M`;
              if (row.american_express) facetContext += `, American Express: $${(row.american_express / 1000000).toFixed(1)}M`;
              if (row.capital_one) facetContext += `, Capital One: $${(row.capital_one / 1000000).toFixed(1)}M`;
              if (row.discover) facetContext += `, Discover: $${(row.discover / 1000000).toFixed(1)}M`;
              if (row.dave) facetContext += `, Dave: $${(row.dave / 1000000).toFixed(1)}M`;
              if (row.earnin) facetContext += `, Earnin: $${(row.earnin / 1000000).toFixed(1)}M`;
              if (row.empower_finance) facetContext += `, Empower Finance: $${(row.empower_finance / 1000000).toFixed(1)}M`;
              if (row.moneylion) facetContext += `, MoneyLion: $${(row.moneylion / 1000000).toFixed(1)}M`;
              if (row.rocket_money) facetContext += `, Rocket Money: $${(row.rocket_money / 1000000).toFixed(1)}M`;
              if (row.sofi) facetContext += `, SoFI: $${(row.sofi / 1000000).toFixed(1)}M`;
              if (row.cashapp) facetContext += `, CashApp: $${(row.cashapp / 1000000).toFixed(1)}M`;
              if (row.paypal) facetContext += `, PayPal: $${(row.paypal / 1000000).toFixed(1)}M`;
              if (row.venmo) facetContext += `, Venmo: $${(row.venmo / 1000000).toFixed(1)}M`;
              if (row.bank_of_america) facetContext += `, Bank of America: $${(row.bank_of_america / 1000000).toFixed(1)}M`;
              if (row.chase) facetContext += `, Chase: $${(row.chase / 1000000).toFixed(1)}M`;
              if (row.wells_fargo) facetContext += `, Wells Fargo: $${(row.wells_fargo / 1000000).toFixed(1)}M`;
              if (row.credit_karma) facetContext += `, Credit Karma: $${(row.credit_karma / 1000000).toFixed(1)}M`;
              if (row.self_financial) facetContext += `, Self Financial: $${(row.self_financial / 1000000).toFixed(1)}M`;
              if (row.grand_total) facetContext += `, Total: $${(row.grand_total / 1000000).toFixed(1)}M`;
              facetContext += `\n`;
            });
          } else if (facet.type === 'company_comparison') {
            data.forEach((row: any, idx: number) => {
              facetContext += `${idx + 1}. `;
              if (row.date_coded) facetContext += `Date: ${row.date_coded}`;
              Object.keys(row).forEach(key => {
                if (key !== 'date_coded' && key !== 'id' && row[key] && typeof row[key] === 'number') {
                  facetContext += `, ${key.replace(/_/g, ' ')}: $${(row[key] / 1000000).toFixed(1)}M`;
                }
              });
              facetContext += `\n`;
            });
          } else if (facet.type === 'trend_analysis') {
            data.forEach((row: any, idx: number) => {
              facetContext += `${idx + 1}. `;
              if (row.date_coded) facetContext += `Date: ${row.date_coded}`;
              if (row.chime) facetContext += `, Chime: $${(row.chime / 1000000).toFixed(1)}M`;
              if (row.grand_total) facetContext += `, Total: $${(row.grand_total / 1000000).toFixed(1)}M`;
              facetContext += `\n`;
            });
          } else if (facet.type === 'volume_analysis') {
            data.forEach((row: any, idx: number) => {
              facetContext += `${idx + 1}. `;
              if (row.date_coded) facetContext += `Date: ${row.date_coded}`;
              if (row.grand_total) facetContext += `, Total Spend: $${(row.grand_total / 1000000).toFixed(1)}M`;
              facetContext += `\n`;
            });
          }

          console.log(`Context text length for ${facet.type}:`, facetContext.length);
          return facetContext;
          
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
    console.log('=== END CHIME GATHER API DEBUG ===');

    return NextResponse.json({ 
      contextText,
      facetCount: intentResponse.facets?.length || 0,
      successCount: contextText ? contextText.split('\n\n').length : 0,
      selectedCharts: intentResponse.selectedCharts || [],
      chartContext: intentResponse.chartContext || ''
    });

  } catch (error) {
    console.error('Chime Gather API error:', error);
    return NextResponse.json(
      { error: 'Failed to gather data' },
      { status: 500 }
    );
  }
}
