'use client';

import { useState } from 'react';
import Sidebar from './components/Sidebar';
import SearchView from './components/SearchView';
import DatabaseViewIntent from './components/DatabaseViewIntent';
import DashboardView from './components/DashboardView';
import CampaignsView from './components/CampaignsView';

export default function Home() {
  const [activeView, setActiveView] = useState('campaigns');
  const [initialChatMessage, setInitialChatMessage] = useState<string | null>(null);
  const [originalSubjectLine, setOriginalSubjectLine] = useState<string | null>(null);

  const handleSuggestionRequest = (subjectLine: string) => {
    const prompt = `This is a subject line I'm considering for a marketing email: "${subjectLine}". Provide some suggestions to help me achieve higher engagement.`;
    setInitialChatMessage(prompt);
    // Store the original subject line separately for display purposes
    setOriginalSubjectLine(subjectLine);
  };

  const renderActiveView = () => {
    switch (activeView) {
      case 'search':
        return <SearchView onViewChange={setActiveView} onSuggestionRequest={handleSuggestionRequest} />;
      case 'database':
        return <DatabaseViewIntent 
          initialMessage={initialChatMessage} 
          originalSubjectLine={originalSubjectLine}
          onMessageSent={() => {
            setInitialChatMessage(null);
            setOriginalSubjectLine(null);
          }} 
        />;
      case 'dashboard':
        return <DashboardView onViewChange={setActiveView} />;
      case 'campaigns':
        return <CampaignsView onViewChange={setActiveView} />;
      default:
        return <SearchView onViewChange={setActiveView} onSuggestionRequest={handleSuggestionRequest} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#202123] flex">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <div className="flex-1 ml-16">
        {renderActiveView()}
      </div>
    </div>
  );
}