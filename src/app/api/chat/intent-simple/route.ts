import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { userPrompt, originalSubjectLine } = await request.json();
    
    console.log('=== SIMPLE INTENT API DEBUG ===');
    console.log('userPrompt:', userPrompt);
    console.log('originalSubjectLine:', originalSubjectLine);

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

            // Simple intent analysis without database context
            const currentDate = new Date().toISOString().split('T')[0];
            const intentPrompt = `Analyze this user request and determine what data would be most helpful:

User request: "${userPrompt}"
${originalSubjectLine ? `Original subject line: "${originalSubjectLine}"` : ''}

Current date context: Today is ${currentDate}. The database contains email data primarily from 2025 (July-October 2025). When generating date ranges, use 2025 dates instead of 2024.

Database Schema:
Table: subject_lines
- id (int): Primary key
- subject_line (text): The email subject line text
- company (text): Company name (e.g., "Capital One", "Chase", "American Express")
- sub_industry (text): Industry category (e.g., "Financial Services - Banking", "Financial Services - Credit Cards")
- open_rate (float): Open rate as decimal (0.0 to 1.0)
- projected_volume (int): Email volume/send size
- date_sent (date): When the email was sent
- created_at (timestamp): Record creation time
- mailing_type (text): Type of mailing (e.g., "Acquisition", "Retention")
- inbox_rate (float): Inbox delivery rate
- spam_rate (float): Spam rate
- read_rate (float): Read rate
- read_delete_rate (float): Read and delete rate
- delete_without_read_rate (float): Delete without read rate

Sample rows:
1. id: 3644, subject_line: "A federal holiday is coming up", company: "Capital One", sub_industry: "Financial Services - Banking", open_rate: 0.3004, projected_volume: 10681779, date_sent: "2025-08-11", mailing_type: "Acquisition"
2. id: 3645, subject_line: "As the seasons change, so do fraud tactics", company: "Capital One", sub_industry: "Financial Services - Banking", open_rate: 0.254, projected_volume: 10147179, date_sent: "2025-08-12", mailing_type: "Acquisition"

Table: subject_line_embeddings  
- subject_line_id (int): Foreign key to subject_lines.id
- embedding (vector): 1536-dimensional vector embedding for similarity search

Return JSON with this EXACT structure:
{
  "intent": "Clear description of what the user is trying to determine",
  "facets": [
    {
      "type": "subject_line|volume|open_rates",
      "parameters": {
        "company": [],
        "industry": [],
        "timeframe": "recent|last 3 months|this year"
      },
      "subject_line": "actual subject line here",
      "sql": "SQL statement to run in postgres for this specific facet"
    }
  ]
}

Facet types:
- "subject_line": For similar subject lines, subject line analysis, examples
- "volume": For email volume, largest campaigns, biggest sends, high-volume campaigns  
- "open_rates": For successful campaigns, popular messages, good subject lines, engaged emails

IMPORTANT: For comparison questions (e.g., "Did X send more emails in July or August?", "Compare X vs Y", "Which month had higher volume?"), create SEPARATE facets for each comparison point:
- One facet for July data
- One facet for August data
- One facet for Company A vs Company B
- etc.

This allows the system to retrieve data for each comparison point separately and provide accurate comparisons.

Only include facets that are relevant. If no facets are needed, return {"intent": "...", "facets": []}.

Return ONLY valid JSON, no other text.`;

    console.log('Sending to OpenAI...');

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
    console.log('OpenAI response:', intentResponseText);

    let intentResponse;
    try {
      intentResponse = JSON.parse(intentResponseText);
    } catch (error) {
      console.error('JSON parse error:', error);
      intentResponse = {
        intent: "User is asking about email marketing",
        facets: []
      };
    }

    console.log('Final intent response:', JSON.stringify(intentResponse, null, 2));
    console.log('=== END SIMPLE INTENT API DEBUG ===');

    return NextResponse.json(intentResponse);

  } catch (error) {
    console.error('Simple Intent API error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze intent' },
      { status: 500 }
    );
  }
}
