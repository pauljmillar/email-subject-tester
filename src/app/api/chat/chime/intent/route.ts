import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { userPrompt, selectedCharts } = await request.json();
    
    console.log('=== CHIME INTENT API DEBUG ===');
    console.log('userPrompt:', userPrompt);
    console.log('selectedCharts:', selectedCharts);

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

    // Intent analysis for dashboard/analytics queries
    const currentDate = new Date().toISOString().split('T')[0];
    const intentPrompt = `Analyze this user request and determine what data would be most helpful:

User request: "${userPrompt}"
${selectedCharts && selectedCharts.length > 0 ? `Selected charts: ${selectedCharts.join(', ')}` : 'No charts selected'}

CHART-TO-COMPANY MAPPING:
- "credit-card": Chime, American Express, Capital One, Discover
- "credit-builder": Chime, Credit Karma, Self Financial  
- "ewa": Chime, Dave, Earnin, Empower Finance, MoneyLion
- "neobank": Chime, Ally, Current, One Finance, Varo
- "other": Chime, Rocket Money, SoFI
- "p2p": Chime, CashApp, PayPal, Venmo
- "traditional": Chime, Bank of America, Chase, Wells Fargo

IMPORTANT: When a chart is selected, focus the SQL query on ONLY the companies in that chart category. Chime should ALWAYS be included as it's a key player across all categories. For example:
- If "ewa" is selected, include chime, dave, earnin, empower_finance, moneylion columns
- If "credit-card" is selected, include chime, american_express, capital_one, discover columns
- If "credit-builder" is selected, include chime, credit_karma, self_financial columns

Current date context: Today is ${currentDate}. The database contains spend data primarily from 2025 (April 2023 - April 2025). When generating date ranges, use 2025 dates instead of 2024.

Database Schema:
Table: spend_summary
- id (int): Primary key
- date_coded (text): Month/year identifier (e.g., "April 2023", "May 2024")
- chime (decimal): Chime spend amount
- credit_karma (decimal): Credit Karma spend amount
- self_financial (decimal): Self Financial spend amount
- american_express (decimal): American Express spend amount
- capital_one (decimal): Capital One spend amount
- discover (decimal): Discover spend amount
- dave (decimal): Dave spend amount
- earnin (decimal): Earnin spend amount
- empower_finance (decimal): Empower Finance spend amount
- moneylion (decimal): MoneyLion spend amount
- ally (decimal): Ally spend amount
- current (decimal): Current spend amount
- one_finance (decimal): One Finance spend amount
- varo (decimal): Varo spend amount
- rocket_money (decimal): Rocket Money spend amount
- sofi (decimal): SoFI spend amount
- cashapp (decimal): CashApp spend amount
- paypal (decimal): PayPal spend amount
- venmo (decimal): Venmo spend amount
- bank_of_america (decimal): Bank of America spend amount
- chase (decimal): Chase spend amount
- wells_fargo (decimal): Wells Fargo spend amount
- year (text): Year identifier
- grand_total (decimal): Total spend across all companies
- category (text): Category classification
- created_at (timestamp): Record creation time
- updated_at (timestamp): Record update time

Sample rows:
1. date_coded: "April 2023", chime: 18193367, american_express: 26582380, capital_one: 23147106, discover: 35246397, grand_total: 187265347
2. date_coded: "May 2023", chime: 20205513, american_express: 28000000, capital_one: 25000000, discover: 38000000, grand_total: 200000000

Return JSON with this EXACT structure:
{
  "intent": "Clear description of what the user is trying to determine",
  "selectedCharts": ["chart1", "chart2"],
  "chartContext": "Description of what charts are selected and what companies they represent",
  "facets": [
    {
      "type": "spend_analysis|company_comparison|trend_analysis|volume_analysis",
      "parameters": {
        "companies": [],
        "timeframe": "recent|last 3 months|this year|all time",
        "categories": []
      },
      "sql": "SQL statement to run in postgres for this specific facet"
    }
  ]
}

Facet types:
- "spend_analysis": For spend amounts, budget analysis, financial data
- "company_comparison": For comparing companies, competitive analysis
- "trend_analysis": For time-based trends, growth patterns, seasonal analysis
- "volume_analysis": For volume metrics, scale analysis, size comparisons

CRITICAL: Generate appropriate SQL queries based on the user's request:

SPEND ANALYSIS:
- User asks about spend amounts: "How much did Chime spend?", "What's the total budget?", "Show me spend data"
- Generate SQL to select relevant spend columns and time periods

COMPANY COMPARISON:
- User asks about comparing companies: "Compare Chime vs Chase", "Which company spends more?", "Show me top spenders"
- Generate SQL to select multiple companies and compare their spend

TREND ANALYSIS:
- User asks about trends over time: "Show me trends", "How has spending changed?", "What's the growth rate?"
- Generate SQL to select time series data with date ordering

VOLUME ANALYSIS:
- User asks about volume metrics: "What's the total volume?", "Show me the biggest campaigns", "Which month had highest spend?"
- Generate SQL to select volume-related metrics and aggregations

Examples:
- "Show me Chime's spending over time" → spend_analysis with companies=["Chime"], timeframe="all time"
- "Compare Chase vs Bank of America" → company_comparison with companies=["Chase", "Bank of America"]
- "What are the spending trends for credit card companies?" → trend_analysis with companies=["American Express", "Capital One", "Discover"]
- "Which month had the highest total spend?" → volume_analysis with timeframe="all time"

IMPORTANT: For comparison questions (e.g., "Compare X vs Y", "Which company spends more?", "Show me trends for different companies"), create SEPARATE facets for each comparison point:
- One facet for Company A data
- One facet for Company B data
- One facet for trend analysis
- etc.

This allows the system to retrieve data for each comparison point separately and provide accurate comparisons.

Only include facets that are relevant. If no facets are needed, return {"intent": "...", "facets": []}.

Return ONLY valid JSON, no other text.`;

    console.log('Sending to OpenAI...');

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are an intent analysis system for financial spend data. Return only valid JSON responses.' },
        { role: 'user', content: intentPrompt }
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const intentResponseText = completion.choices[0]?.message?.content || '{}';
    console.log('OpenAI response:', intentResponseText);

    let intentResponse;
    try {
      intentResponse = JSON.parse(intentResponseText);
    } catch (error) {
      console.error('JSON parse error:', error);
      intentResponse = {
        intent: "User is asking about financial spend data",
        facets: []
      };
    }

    console.log('Final intent response:', JSON.stringify(intentResponse, null, 2));
    console.log('=== END CHIME INTENT API DEBUG ===');

    return NextResponse.json(intentResponse);

  } catch (error) {
    console.error('Chime Intent API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze intent' },
      { status: 500 }
    );
  }
}
