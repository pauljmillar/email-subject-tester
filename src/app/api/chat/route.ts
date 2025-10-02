import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Forward the request to the RAG API
    const ragResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/rag`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        message,
        context_type: 'similar' // Use similar subject lines for context
      }),
    });

    if (!ragResponse.ok) {
      const errorData = await ragResponse.json().catch(() => ({ error: 'RAG API error' }));
      return NextResponse.json(
        { error: errorData.error || 'Failed to get response from RAG system' },
        { status: ragResponse.status }
      );
    }

    const ragData = await ragResponse.json();
    return NextResponse.json({ 
      response: ragData.response,
      context_subject_lines: ragData.context_subject_lines,
      context_type: ragData.context_type
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to get response from AI' },
      { status: 500 }
    );
  }
}
