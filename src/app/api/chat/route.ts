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
    const { message, isInitialRequest = false, originalSubjectLine } = await request.json();
    
    console.log('=== CHAT API DEBUG ===');
    console.log('isInitialRequest:', isInitialRequest);
    console.log('message:', message);
    console.log('originalSubjectLine:', originalSubjectLine);

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

    const supabase = createClient(supabaseUrl, supabaseKey);

    let contextSubjectLines: ContextSubjectLine[] = [];
    let subjectLineForSearch = message;

    if (isInitialRequest) {
      console.log('Processing INITIAL request');
      // For initial requests: use the originalSubjectLine directly
      if (originalSubjectLine) {
        subjectLineForSearch = originalSubjectLine;
        console.log('Using originalSubjectLine:', subjectLineForSearch);
      } else {
        // Fallback: extract from message if originalSubjectLine not provided
        if (message.includes('"') && message.includes('"')) {
          const match = message.match(/"([^"]+)"/);
          if (match) {
            subjectLineForSearch = match[1];
            console.log('Extracted subject line from message:', subjectLineForSearch);
          }
        }
      }

      // Generate embedding for the subject line only
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: subjectLineForSearch,
      });

      const queryEmbedding = embeddingResponse.data[0].embedding;

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
    } else {
      console.log('Processing SUBSEQUENT request');
      // For subsequent chat messages: no similar subject lines, just clean chat
      contextSubjectLines = [];
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

    // Create the system prompt with context
    let systemPrompt = '';
    
    console.log('contextSubjectLines.length:', contextSubjectLines.length);
    console.log('contextText:', contextText);
    
    if (isInitialRequest) {
      console.log('Creating INITIAL system prompt');
      // For initial requests: focus on subject line analysis and improvement
      systemPrompt = `You are an expert email marketing consultant specializing in subject line optimization. Your goal is to help users create compelling, high-performing email subject lines that drive engagement and conversions.

Key principles for effective subject lines:
- Keep them concise (under 50 characters when possible)
- Use action-oriented language and power words
- Create urgency or curiosity without being spammy
- Personalize when possible
- Test different approaches (benefit-focused vs. curiosity-driven)
- Avoid spam trigger words
- Consider mobile display (shorter is better)

${contextText}

Analyze the user's subject line and provide specific, actionable suggestions for improvement. Focus on:
1. Immediate improvements they can make
2. Alternative approaches to test
3. Best practices from successful campaigns
4. Specific word choices and phrasing suggestions

Be encouraging but honest about what works and what doesn't. Provide concrete examples.`;
    } else {
      console.log('Creating SUBSEQUENT system prompt');
      // For subsequent chat messages: general email marketing consultant
      systemPrompt = `You are an expert email marketing consultant. Help the user with their email marketing questions and provide valuable insights based on your expertise.

Be helpful, knowledgeable, and provide actionable advice. Focus on answering their specific questions about email marketing best practices, subject line optimization, and engagement strategies.`;
    }
    
    console.log('Final system prompt:', systemPrompt);

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
    console.log('Returning context_subject_lines count:', contextSubjectLines.length);
    console.log('=== END CHAT API DEBUG ===');

    return NextResponse.json({ 
      response,
      context_subject_lines: contextSubjectLines,
      context_type: 'similar'
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Failed to get response from AI' },
      { status: 500 }
    );
  }
}
