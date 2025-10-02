'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
}

interface DatabaseViewProps {
  initialMessage?: string | null;
  onMessageSent?: () => void;
}

export default function DatabaseView({ initialMessage, onMessageSent }: DatabaseViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const typewriterEffect = async (messageId: string, fullContent: string, speed: number = 30) => {
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
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle initial message from suggestion request
  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: initialMessage,
        timestamp: new Date(),
      };
      setMessages([userMessage]);
      onMessageSent?.();
      
      // Automatically send the message to get AI response
      sendMessageToAI(initialMessage);
    }
  }, [initialMessage, messages.length, onMessageSent]);

  const sendMessageToAI = async (messageContent: string) => {
    if (!messageContent || isLoading) return;

    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageContent }),
      });

      if (response.ok) {
        const data = await response.json();
        const fullResponse = data.response || 'I apologize, but I could not generate a response.';
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '', // Start with empty content
          timestamp: new Date(),
          isTyping: true,
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Start typewriter effect
        await typewriterEffect(assistantMessage.id, fullResponse);
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
    
    // Use the sendMessageToAI function to avoid code duplication
    await sendMessageToAI(messageToSend);
  };

  return (
    <div className="flex flex-col h-screen bg-[#202123]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

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
