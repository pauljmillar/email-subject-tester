'use client';

import { useState, useEffect, useRef } from 'react';

interface SearchResult {
  subject_line: string;
  open_rate: number;
  open_rate_percentage: string;
  grade: string;
  similarity: number;
  score: number;
  company?: string;
  sub_industry?: string;
  mailing_type?: string;
  read_rate_percentage?: string;
  inbox_rate_percentage?: string;
  match_type?: string;
  word_positions?: number[];
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search effect
  useEffect(() => {
    const searchTimeout = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data.results || []);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResultClick = (subjectLine: string) => {
    setQuery(subjectLine);
    setShowSuggestions(false);
  };

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-400 bg-green-900/30 border border-green-500/30';
      case 'B': return 'text-blue-400 bg-blue-900/30 border border-blue-500/30';
      case 'C': return 'text-yellow-400 bg-yellow-900/30 border border-yellow-500/30';
      case 'D': return 'text-orange-400 bg-orange-900/30 border border-orange-500/30';
      case 'F': return 'text-red-400 bg-red-900/30 border border-red-500/30';
      default: return 'text-gray-400 bg-gray-900/30 border border-gray-500/30';
    }
  };

  // Function to highlight matching words in subject lines
  const highlightMatchingWords = (subjectLine: string, query: string) => {
    if (!query.trim()) return subjectLine;
    
    const queryWords = query.toLowerCase().trim().split(/\s+/);
    const subjectWords = subjectLine.split(/(\s+)/);
    
    return subjectWords.map((word, index) => {
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      const isMatch = queryWords.some(queryWord => 
        cleanWord.includes(queryWord.toLowerCase()) || 
        queryWord.toLowerCase().includes(cleanWord)
      );
      
      if (isMatch && cleanWord) {
        return <span key={index} className="bg-yellow-200 text-yellow-900 font-semibold px-1 rounded">{word}</span>;
      }
      return <span key={index}>{word}</span>;
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Test Your Email Subject Line
          </h1>
          <p className="text-lg text-gray-300">
            Get suggestions based on millions of successful email campaigns
          </p>
        </div>

        <div className="relative">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowSuggestions(results.length > 0)}
              placeholder="How can I help you?"
              className="w-full px-6 py-4 text-lg bg-gray-800 text-white border border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
            />
            {isLoading && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              </div>
            )}
          </div>

          {showSuggestions && results.length > 0 && (
            <div
              ref={dropdownRef}
              className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded-xl shadow-lg z-50 max-h-96 overflow-y-auto"
            >
              {results.map((result, index) => (
                <div
                  key={index}
                  onClick={() => handleResultClick(result.subject_line)}
                  className="p-4 hover:bg-gray-700 cursor-pointer border-b border-gray-600 last:border-b-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-white font-medium mb-1">
                        {highlightMatchingWords(result.subject_line, query)}
                      </p>
                      <div className="flex items-center space-x-3 text-sm text-gray-300">
                        <span>Open rate: {result.open_rate_percentage}%</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(result.grade)}`}>
                          Grade: {result.grade}
                        </span>
                        {result.company && (
                          <span className="text-xs text-gray-400">• {result.company}</span>
                        )}
                        {result.match_type && (
                          <span className="text-xs text-blue-400">• {result.match_type.replace(/_/g, ' ')}</span>
                        )}
                      </div>
                      {(result.sub_industry || result.mailing_type) && (
                        <div className="text-xs text-gray-400 mt-1">
                          {result.sub_industry && <span>{result.sub_industry}</span>}
                          {result.sub_industry && result.mailing_type && <span> • </span>}
                          {result.mailing_type && <span>{result.mailing_type}</span>}
                        </div>
                      )}
                    </div>
                    <div className="text-right text-sm text-gray-400">
                      <div>Similarity: {(result.similarity * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showSuggestions && results.length === 0 && query.length >= 2 && !isLoading && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-600 rounded-xl shadow-lg z-50 p-4">
              <p className="text-gray-300 text-center">No matching subject lines found</p>
            </div>
          )}
        </div>

        {query.length > 0 && !showSuggestions && (
          <div className="mt-6 p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300 text-sm">
              💡 <strong>Tip:</strong> Start typing to see similar subject lines with their open rates and grades. 
              Higher grades (A-B) typically perform better!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}