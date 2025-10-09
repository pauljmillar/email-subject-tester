import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, isInitialRequest = false, selectedCharts, contextText, chartContext } = await request.json();
    
    console.log('=== CHIME CHAT API DEBUG ===');
    console.log('isInitialRequest:', isInitialRequest);
    console.log('message:', message);
    console.log('selectedCharts:', selectedCharts);
    console.log('contextText provided:', !!contextText);

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Use provided contextText or empty string
    const finalContextText = contextText || '';
    console.log('Using contextText length:', finalContextText.length);

    // Create the system prompt with context
    let systemPrompt = '';
    
    if (isInitialRequest) {
      console.log('Creating INITIAL system prompt');
      // For initial requests: focus on spend data analysis and insights
      systemPrompt = `You are an expert financial analyst specializing in marketing spend data analysis. 

1. State the user's original question or request.

Below is financial spend data from our database of marketing campaigns across various financial services companies.
${finalContextText}

2. Analyze the spend data and provide insights about:
   - Spending patterns and trends
   - Company performance comparisons
   - Budget allocation insights
   - Growth or decline patterns
   - Key findings from the data

3. Provide specific recommendations based on the data:
   - What the data reveals about spending strategies
   - Which companies are performing well
   - Trends to watch for
   - Strategic insights for budget planning

4. End with actionable insights and next steps for the user.`;
    } else {
      console.log('Creating SUBSEQUENT system prompt');
      // For subsequent chat messages: general financial analyst
      if (finalContextText && finalContextText.trim().length > 0) {
        systemPrompt = `You are an expert financial analyst specializing in marketing spend data analysis. 

${chartContext ? `CHART CONTEXT: ${chartContext}` : ''}

Below is marketing spend data from our database:

${finalContextText}

Use this data to answer the user's request. Print 3-5 rows of the data from the database to demonstrate your thinking, as long as it is relevant.

Reply succinctly and decisively, using short bullet points and a summary sentence. Focus on financial insights, spending patterns, and strategic recommendations.`;
      } else {
        systemPrompt = `You are an expert financial analyst specializing in marketing spend data analysis. 

I couldn't find any information about that in our database. Please provide a brief, helpful response based on general financial analysis principles.

Reply succinctly and decisively, using short bullet points and a summary sentence.`;
      }
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
    console.log('=== END CHIME CHAT API DEBUG ===');

    return NextResponse.json({ 
      response
    });

  } catch (error) {
    console.error('Chime Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to get response from AI' },
      { status: 500 }
    );
  }
}
