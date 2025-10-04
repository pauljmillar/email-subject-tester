'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface DatabaseViewProps {
  initialMessage?: string | null;
  originalSubjectLine?: string | null;
  onMessageSent?: () => void;
}

export default function DatabaseViewIntent({ initialMessage, originalSubjectLine, onMessageSent }: DatabaseViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [debugMode, setDebugMode] = useState(false); // Debug mode flag
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialMessageProcessed = useRef(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const addDebugMessage = useCallback((content: string) => {
    if (!debugMode) return;
    
    const debugMessage: Message = {
      id: `debug-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: 'assistant',
      content: `🔍 **Debug:**\n${content}`,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, debugMessage]);
    setTimeout(() => scrollToBottom(), 0);
  }, [debugMode]);

  const typewriterEffect = useCallback(async (messageId: string, fullContent: string, speed: number = 30) => {
    const words = fullContent.split(' ');
    let currentContent = '';
    
    for (let i = 0; i < words.length; i++) {
      currentContent += (i > 0 ? ' ' : '') + words[i];
      
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, content: currentContent, isTyping: i < words.length - 1 }
          : msg
      ));
      
      // Scroll to bottom after each word
      setTimeout(() => scrollToBottom(), 0);
      
      // Add a small delay between words
      await new Promise(resolve => setTimeout(resolve, speed));
    }
    
    // Mark typing as complete
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, isTyping: false }
        : msg
    ));
  }, []);

  const executeQueries = useCallback(async (intentResponse: any) => {
    console.log('=== EXECUTING QUERIES ===');
    console.log('Intent response:', JSON.stringify(intentResponse, null, 2));
    console.log('Number of facets to process:', intentResponse.facets?.length || 0);

    // Debug: Show intent analysis in a single grouped message
    if (intentResponse.facets && intentResponse.facets.length > 0) {
      let debugContent = `**Intent Analysis:**\n${intentResponse.intent}\n\n**Search Conditions:**\n`;
      intentResponse.facets.forEach((facet: any, index: number) => {
        const conditions = [];
        if (facet.parameters?.company?.length > 0) conditions.push(`Company: ${facet.parameters.company.join(', ')}`);
        if (facet.parameters?.industry?.length > 0) conditions.push(`Industry: ${facet.parameters.industry.join(', ')}`);
        if (facet.parameters?.timeframe) conditions.push(`Timeframe: ${facet.parameters.timeframe}`);
        debugContent += `• Facet ${index + 1} (${facet.type}): ${conditions.join(', ')}\n`;
        if (facet.sql) {
          debugContent += `  SQL: ${facet.sql}\n`;
        }
      });
      addDebugMessage(debugContent);
    }

    let contextText = '';

    if (intentResponse.facets && intentResponse.facets.length > 0) {
      // Execute queries for each facet in parallel
      const queryPromises = intentResponse.facets.map(async (facet: any, index: number) => {
        console.log('Executing query for facet:', facet.type);
        
                try {
                  // Use SQL query if available, otherwise fall back to simple query
                  let response;
                  if (facet.sql) {
                    response = await fetch('/api/data/query-sql', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        sql: facet.sql
                      }),
                    });
                  } else {
                    // Fallback to original query method
                    response = await fetch('/api/data/query-simple', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        facetType: facet.type,
                        parameters: facet.parameters,
                        subjectLine: facet.subject_line || originalSubjectLine
                      }),
                    });
                  }

                  if (response.ok) {
                    const data = await response.json();
                    console.log(`Query result for ${facet.type}:`, data);
                    console.log(`Context text length for ${facet.type}:`, data.contextText?.length || 0);
                    
                    return data.contextText || '';
                  } else {
                    const errorText = await response.text();
                    console.error(`Query failed for ${facet.type}:`, errorText);
                    return '';
                  }
                } catch (error) {
                  console.error(`Error executing query for ${facet.type}:`, error);
                  return '';
                }
      });

      const results = await Promise.all(queryPromises);
      contextText = results.filter(text => text).join('\n\n');
      
      // Debug: Show query results in a single grouped message
      if (debugMode && results.length > 0) {
        let debugContent = `**Query Results:**\n`;
        results.forEach((result, index) => {
          if (result && result.trim()) {
            const lines = result.split('\n').filter((line: string) => line.trim().length > 0);
            const recordCount = lines.filter((line: string) => line.match(/^\d+\./)).length;
            debugContent += `• Facet ${index + 1}: Found ${recordCount} records\n`;
            if (lines.length > 0) {
              debugContent += `  Sample: ${lines[0].trim()}\n`;
            }
          } else {
            debugContent += `• Facet ${index + 1}: No records found\n`;
          }
        });
        addDebugMessage(debugContent);
      }
    }

    console.log('Final context text length:', contextText.length);
    console.log('=== END EXECUTING QUERIES ===');
    
    return contextText;
  }, [originalSubjectLine, addDebugMessage]);

  const sendMessageToAI = useCallback(async (messageContent: string, isInitialRequest: boolean = false) => {
    if (!messageContent || isLoading) return;

    console.log('=== DATABASE VIEW INTENT DEBUG ===');
    console.log('sendMessageToAI called with:');
    console.log('messageContent:', messageContent);
    console.log('isInitialRequest:', isInitialRequest);

    setIsLoading(true);

    try {
      // Step 1: Analyze intent
      console.log('Step 1: Analyzing intent...');
      const intentResponse = await fetch('/api/chat/intent-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userPrompt: messageContent,
          originalSubjectLine: originalSubjectLine
        }),
      });

      if (!intentResponse.ok) {
        throw new Error('Intent analysis failed');
      }

      const intentData = await intentResponse.json();
      console.log('Intent analysis result:', intentData);

      // Step 2: Execute queries based on intent
      console.log('Step 2: Executing queries...');
      let contextText = await executeQueries(intentData);
      
      // Fallback if no context is found
      if (!contextText || contextText.trim().length === 0) {
        console.log('No context found, using fallback...');
        contextText = '\n\nBased on our email marketing database, here are some general insights about successful subject lines:\n- Keep subject lines under 50 characters\n- Use action-oriented language\n- Create urgency without being spammy\n- Personalize when possible\n- Test different approaches';
      }

      // Step 3: Send to chat API with context
      console.log('Step 3: Sending to chat API...');
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          isInitialRequest: isInitialRequest,
          originalSubjectLine: originalSubjectLine,
          contextText: contextText
        }),
      });

      if (chatResponse.ok) {
        const data = await chatResponse.json();
        let fullResponse = data.response || 'I apologize, but I could not generate a response.';
        
        // For initial requests, add the original subject line display
        if (isInitialRequest && originalSubjectLine) {
          fullResponse = `You're considering this subject line: "${originalSubjectLine}"\n\n${fullResponse}`;
        }
        
        // Create assistant message and start typewriter effect
        const assistantMessageId = (Date.now() + 1).toString();
        const assistantMessage: Message = {
          id: assistantMessageId,
          role: 'assistant',
          content: '', // Start with empty content
          timestamp: new Date(),
          isTyping: true,
        };
        
        setMessages(prev => [...prev, assistantMessage]);
        
        // Start typewriter effect
        await typewriterEffect(assistantMessageId, fullResponse);
      } else {
        const errorData = await chatResponse.json().catch(() => ({ error: 'Unknown error' }));
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `Error: ${errorData.error || 'Failed to get response from AI'}`,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered a network error. Please check your connection and try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, originalSubjectLine, typewriterEffect, executeQueries]);

  const handleSubmit = async (e: React.FormEvent, messageContent?: string) => {
    e.preventDefault();
    const messageToSend = messageContent || input.trim();
    if (!messageToSend || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageToSend,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    if (!messageContent) setInput('');
    
    // All user-typed messages are subsequent requests (not initial)
    await sendMessageToAI(messageToSend, false);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle initial message from suggestion request
  useEffect(() => {
    if (initialMessage && messages.length === 0 && !initialMessageProcessed.current) {
      initialMessageProcessed.current = true;
      // Don't add user message for initial suggestions - just get AI response
      onMessageSent?.();
      
      // Automatically send the message to get AI response
      sendMessageToAI(initialMessage, true);
    }
  }, [initialMessage, messages.length, onMessageSent, sendMessageToAI]);

  return (
    <div className="flex flex-col h-screen bg-[#202123]">
      {/* Debug Toggle */}
      <div className="p-2 border-b border-[#343541]">
        <button
          onClick={() => setDebugMode(!debugMode)}
          className={`px-3 py-1 text-xs rounded ${
            debugMode 
              ? 'bg-[#10A37F] text-[#ECECF1]' 
              : 'bg-[#343541] text-[#ECECF1] hover:bg-[#343541]/80'
          }`}
        >
          {debugMode ? '🔍 Debug ON' : '🔍 Debug OFF'}
        </button>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#343541] border border-[#343541] px-4 py-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#10A37F]"></div>
                <span className="text-[#ECECF1]">Analyzing intent and gathering data...</span>
              </div>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl px-4 py-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-[#10A37F] text-[#ECECF1]'
                  : message.content.includes('🔍 **Debug:**')
                  ? 'bg-[#2D2D2D] text-[#ECECF1] border border-[#10A37F] text-sm'
                  : 'bg-[#343541] text-[#ECECF1] border border-[#343541]'
              }`}
            >
              <div className="whitespace-pre-wrap">
                {message.content}
                {message.isTyping && message.role === 'assistant' && (
                  <span className="inline-block w-2 h-4 bg-[#10A37F] ml-1 animate-pulse"></span>
                )}
              </div>
              <div className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-[#343541]">
        <form onSubmit={handleSubmit} className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about your subject lines..."
            className="flex-1 px-4 py-3 bg-[#343541] text-[#ECECF1] border border-[#343541] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#10A37F] placeholder-[#ECECF1]/50"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="px-6 py-3 bg-[#10A37F] text-[#ECECF1] rounded-lg hover:bg-[#10A37F]/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
