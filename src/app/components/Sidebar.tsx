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
      id: 'campaigns', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 4h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ), 
      label: 'Campaigns', 
      description: 'Chime - Competitive Set Campaigns' 
    },
    { 
      id: 'dashboard', 
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      ), 
      label: 'Chime Chat', 
      description: 'AI chat assistant' 
    },
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