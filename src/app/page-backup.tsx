'use client';

import { useState } from 'react';

export default function Home() {
  const [query, setQuery] = useState('');

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Email Subject Line Tester
          </h1>
          <p className="text-lg text-gray-300">
            Test your email subject lines with AI-powered suggestions
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Enter your subject line..."
            className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <div className="mt-4 text-gray-300">
            <p>Query: {query || 'No query entered'}</p>
            <p>Status: Ready to search</p>
          </div>
        </div>
      </div>
    </div>
  );
}
