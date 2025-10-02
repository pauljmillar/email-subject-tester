'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function DatabaseView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response || 'I apologize, but I could not generate a response.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
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
  };

  return (
    <div className="flex flex-col h-screen bg-[#202123]">
      {/* Header */}
      <div className="p-4 border-b border-[#343541]">
        <h1 className="text-xl font-semibold text-[#ECECF1]">Database Chat</h1>
        <p className="text-[#ECECF1]/70 text-sm">Chat with your subject line database</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-[#ECECF1]/70 mt-8">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-[#343541] rounded-full">
              <svg className="w-8 h-8 text-[#10A37F]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-[#ECECF1]">Database Chat</h2>
            <p className="mb-4">Start a conversation with your subject line database</p>
            <div className="bg-[#343541] border border-[#343541] rounded-lg p-4 max-w-md mx-auto">
              <p className="text-sm text-[#ECECF1]/70">
                <strong>Note:</strong> To use the chat feature, you'll need to add your OpenAI API key to the environment variables.
              </p>
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
                : 'bg-[#343541] text-[#ECECF1] border border-[#343541]'
            }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              <div className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#343541] border border-[#343541] px-4 py-3 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#10A37F]"></div>
                <span className="text-[#ECECF1]">Thinking...</span>
              </div>
            </div>
          </div>
        )}

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
