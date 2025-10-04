import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

interface ContextSubjectLine {
  subject_line_id: number;
  subject_line: string;
  open_rate: number;
  similarity_score: number;
  keyword_score?: number;
  combined_score?: number;
  company?: string;
  sub_industry?: string;
  mailing_type?: string;
  read_rate?: number;
  inbox_rate?: number;
  date_sent?: string;
  spam_rate?: number;
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, isInitialRequest = false, originalSubjectLine, contextText } = await request.json();
    
    console.log('=== CHAT API DEBUG ===');
    console.log('isInitialRequest:', isInitialRequest);
    console.log('message:', message);
    console.log('originalSubjectLine:', originalSubjectLine);
    console.log('contextText provided:', !!contextText);

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Check if OpenAI API key is configured
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    // Use provided contextText or empty string
    const finalContextText = contextText || '';
    console.log('Using contextText length:', finalContextText.length);

    // Context is now provided externally via contextText parameter

    // Create the system prompt with context
    let systemPrompt = '';
    
            if (isInitialRequest) {
              console.log('Creating INITIAL system prompt');
              // For initial requests: focus on subject line analysis and improvement
              systemPrompt = `You are an expert email marketing consultant. 

1. State the user's original subject line.

Below is email marketing performance data from historical campaigns similar to the user's subject line.
${finalContextText}

2. Print 5-10 of these subject lines, with the header, "Here are related subject lines with high read rates:" Each row should include the subject, open rate, company

The list of subject lines should include their historical open rates, which are an indication of how good the subject line was.

3. Think about this list of subject lines and open rates (success rates), and use your knowledge of email marketing to suggest 1 - 2 things that could improve the user's original subject line.

4. End with 3 alternative subject lines to the user's original that should perform better than their current.`;
            } else {
              console.log('Creating SUBSEQUENT system prompt');
              // For subsequent chat messages: general email marketing consultant
              systemPrompt = `You are an expert email marketing consultant. 

- If we have included information here from our database of email marketing campaign performance, it will show up here:
${finalContextText}
You should try to answer the user's request with it.  Print 3-5 rows of the data from the database to demonstrate your thinking, as long as it is relevant.

- If no data from our database has been included, reply, "I couldn't find any information about that in our database," then briefly answer the request as best you can.

Either way, reply succinctly and decisively, using short bullet points and a summary sentence.`;
            }
    
            console.log('Final system prompt length:', systemPrompt.length);
            console.log('=== FINAL SYSTEM PROMPT ===');
            console.log(systemPrompt);
            console.log('=== END SYSTEM PROMPT ===');

    // Generate AI response
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 'I apologize, but I could not generate a response.';

    console.log('Final response length:', response.length);
    console.log('=== END CHAT API DEBUG ===');

    return NextResponse.json({ 
      response
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to get response from AI' },
      { status: 500 }
    );
  }
}
