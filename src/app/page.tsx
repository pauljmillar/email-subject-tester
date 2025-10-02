'use client';

import { useState } from 'react';
import Sidebar from './components/Sidebar';
import SearchView from './components/SearchView';
import DatabaseView from './components/DatabaseView';
import NewView from './components/NewView';
import LibraryView from './components/LibraryView';

export default function Home() {
  const [activeView, setActiveView] = useState('search');

  const renderActiveView = () => {
    switch (activeView) {
      case 'search':
        return <SearchView />;
      case 'database':
        return <DatabaseView />;
      case 'new':
        return <NewView />;
      case 'library':
        return <LibraryView />;
      default:
        return <SearchView />;
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