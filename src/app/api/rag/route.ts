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

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
}

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export async function POST(request: NextRequest) {
  try {
    const { message, context_type = 'similar' } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    // Extract just the subject line from the message for vector similarity search
    let subjectLineForSearch = message;
    if (message.includes('"') && message.includes('"')) {
      // Extract text between quotes if it's a formatted prompt
      const match = message.match(/"([^"]+)"/);
      if (match) {
        subjectLineForSearch = match[1];
      }
    }

    // Generate embedding for the subject line only
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: subjectLineForSearch,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

      // Find similar subject lines using vector similarity
      let contextSubjectLines = [];
      
      if (context_type === 'similar') {
        // Use hybrid approach: combine vector similarity with keyword matching
        const { data: similarLines, error: similarError } = await supabase.rpc(
          'find_similar_subject_lines',
          {
            query_embedding: queryEmbedding,
            similarity_threshold: 0.3, // Lower threshold for vector similarity
            max_results: 20 // Get more results for filtering
          }
        );

        if (similarError) {
          console.error('Error finding similar subject lines:', similarError);
        } else {
          // Apply hybrid filtering: combine vector similarity with keyword matching
          const queryWords = subjectLineForSearch.toLowerCase()
            .replace(/[^\w\s]/g, ' ') // Remove punctuation
            .split(/\s+/)
            .filter((word: string) => word.length > 1); // Include shorter words like "12"
          
          console.log('Query words extracted:', queryWords);
          
          contextSubjectLines = (similarLines || [])
            .map((line: ContextSubjectLine) => {
              // Calculate keyword matching score with fuzzy matching
              const matchingWords = queryWords.filter((word: string) => {
                const lowerSubject = line.subject_line.toLowerCase();
                return lowerSubject.includes(word) || 
                       word.includes(lowerSubject) ||
                       // Check for partial matches (e.g., "bonus" matches "bonuses")
                       queryWords.some((qw: string) => qw.includes(word) || word.includes(qw));
              });
              const keywordScore = queryWords.length > 0 ? matchingWords.length / queryWords.length : 0;
              
              // Calculate combined score: 40% vector similarity + 60% keyword matching
              const combinedScore = (0.4 * line.similarity_score) + (0.6 * keywordScore);
              
              return {
                ...line,
                keyword_score: keywordScore,
                combined_score: combinedScore
              };
            })
            .filter((line: ContextSubjectLine & { keyword_score: number; combined_score: number }) => 
              // Keep lines that have either good vector similarity OR good keyword matching
              line.similarity_score >= 0.3 || line.keyword_score >= 0.3
            )
            .sort((a: ContextSubjectLine & { keyword_score: number; combined_score: number }, b: ContextSubjectLine & { keyword_score: number; combined_score: number }) => b.combined_score - a.combined_score)
            .slice(0, 10); // Take top 10 results
        }
    } else if (context_type === 'top_performing') {
      // Get top-performing subject lines
      const { data: topLines, error: topError } = await supabase.rpc(
        'get_top_performing_subject_lines',
        { max_results: 5 }
      );

      if (topError) {
        console.error('Error getting top performing subject lines:', topError);
      } else {
        contextSubjectLines = topLines || [];
      }
    }

    // If no similar lines found, get top performing as fallback
    if (contextSubjectLines.length === 0) {
      const { data: fallbackLines } = await supabase.rpc(
        'get_top_performing_subject_lines',
        { max_results: 10 }
      );
      contextSubjectLines = fallbackLines || [];
    }

    // Create context from similar subject lines
    let contextText = '';
    if (contextSubjectLines.length > 0) {
      contextText = '\n\nHere are some relevant high-performing subject lines from our database:\n';
      contextSubjectLines.forEach((line: ContextSubjectLine, index: number) => {
        contextText += `${index + 1}. "${line.subject_line}" (Open Rate: ${(line.open_rate * 100).toFixed(1)}%`;
        if (line.company) contextText += `, Company: ${line.company}`;
        if (line.sub_industry) contextText += `, Industry: ${line.sub_industry}`;
        contextText += ')\n';
      });
    }

    // Create enhanced system prompt with context
    const systemPrompt = `You are a helpful assistant that specializes in email marketing and subject line optimization. You have access to a database of successful email subject lines and can provide insights on improving email subject lines based on open rates, engagement metrics, and best practices.

${contextText}

When providing suggestions, reference the similar subject lines above and explain why certain approaches work based on the performance data.`;

    // Call OpenAI API with enhanced context
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: message
        }
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return NextResponse.json({ 
      response,
      context_subject_lines: contextSubjectLines,
      context_type
    });

  } catch (error) {
    console.error('RAG API error:', error);
    
    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json(
          { error: 'OpenAI API key is invalid or missing' },
          { status: 401 }
        );
      }
      if (error.message.includes('quota')) {
        return NextResponse.json(
          { error: 'OpenAI API quota exceeded' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to get response from AI' },
      { status: 500 }
    );
  }
}
