'use client';

import { useState } from 'react';

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

export default function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const menuItems = [
    { 
      id: 'search', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      ), 
      label: 'Search', 
      description: 'Search subject lines' 
    },
    { 
      id: 'database', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
      ), 
      label: 'Database', 
      description: 'Chat with database' 
    },
    { 
      id: 'new', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
      ), 
      label: 'New', 
      description: 'Create new' 
    },
    { 
      id: 'library', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ), 
      label: 'Library', 
      description: 'Browse library' 
    },
  ];

  return (
    <div className={`fixed left-0 top-0 h-full bg-[#202123] border-r border-[#343541] transition-all duration-300 z-50 ${
      isExpanded ? 'w-64' : 'w-16'
    }`}>
      {/* Expand/Collapse Button */}
      <div className="p-4 border-b border-[#343541]">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-center p-2 hover:bg-[#343541] rounded-lg transition-colors"
          title={isExpanded ? 'Close sidebar' : 'Open sidebar'}
        >
          <div className="w-6 h-6 flex items-center justify-center">
            {isExpanded ? (
              <svg className="w-4 h-4 text-[#ECECF1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-[#ECECF1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </div>
          {isExpanded && (
            <span className="ml-3 text-[#ECECF1] font-medium">Menu</span>
          )}
        </button>
      </div>

      {/* Menu Items */}
      <div className="p-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id)}
            className={`w-full flex items-center p-3 rounded-lg transition-colors mb-1 ${
              activeView === item.id 
                ? 'bg-[#10A37F] text-[#ECECF1]' 
                : 'text-[#ECECF1] hover:bg-[#343541]'
            }`}
            title={!isExpanded ? item.description : undefined}
          >
            <div className="w-6 h-6 flex items-center justify-center">
              {item.icon}
            </div>
            {isExpanded && (
              <div className="ml-3 flex-1 text-left">
                <div className="font-medium">{item.label}</div>
                <div className="text-xs text-[#ECECF1]/70">{item.description}</div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
