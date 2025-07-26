import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Sun, Moon } from 'lucide-react';

// Bible components
import NavigationSidebar from './components/NavigationSidebar';
import ChapterDisplay from './components/ChapterDisplay';
import SearchInterface from './components/SearchInterface';
import VersionSelector from './components/VersionSelector';
import VerseTool from './components/VerseTool';

// Shared components
import NavigationMenu from '../Library/NavigationMenu';

// Bible hooks
import { useBibleNavigation } from './hooks/useBibleNavigation';
import { useBibleSearch } from './hooks/useBibleSearch';
import { useVerseSelection } from './hooks/useVerseSelection';

const BibleReader = () => {
  const navigate = useNavigate();
  
  // State management
  const [currentVersion, setCurrentVersion] = useState('NLT');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('read'); // 'read' | 'search'
  const [isDarkMode, setIsDarkMode] = useState(false); // Light/dark theme toggle
  
  // Custom hooks
  const {
    currentBook,
    currentChapter,
    chapterData,
    loading: navLoading,
    error: navError,
    navigateToChapter,
    navigateToReference
  } = useBibleNavigation(currentVersion);
  
  const {
    searchQuery,
    searchResults,
    searching,
    performSearch,
    clearSearch
  } = useBibleSearch(currentVersion);
  
  const {
    selectedVerses,
    selectVerse,
    clearSelection,
    getSelectedText
  } = useVerseSelection();

  // Handle version change
  const handleVersionChange = (version) => {
    setCurrentVersion(version);
  };

  // Handle navigation
  const handleNavigation = (book, chapter) => {
    navigateToChapter(book, chapter);
    setActiveTab('read');
  };

  // Handle search
  const handleSearch = (query) => {
    performSearch(query);
    setActiveTab('search');
  };

  // Handle reference jump
  const handleReferenceJump = (reference) => {
    navigateToReference(reference);
    setActiveTab('read');
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-900' 
        : 'bg-library-gradient'
    }`}>
      {/* Header */}
      <div className={`backdrop-blur-sm border-b transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-gray-900/95 border-gray-600' 
          : 'bg-dark-wood/90 border-brass/20'
      }`}>
        {/* Top Navigation Bar with Title */}
        <div className={`border-b px-4 py-3 ${
          isDarkMode ? 'border-gray-600' : 'border-brass/20'
        }`}>
          <div className="flex items-center justify-between">
            {/* Left side - Navigation */}
            <div className="flex items-center gap-4">
              <NavigationMenu />
              
              <div className={`h-6 w-px ${
                isDarkMode ? 'bg-gray-600' : 'bg-brass/30'
              }`} />
              
              <h1 className={`text-2xl font-cormorant ${
                isDarkMode ? 'text-blue-400' : 'text-brass'
              }`}>
                📖 Bible Room - Reading & Study
              </h1>
            </div>

            {/* Right side - Tools */}
            <div className="flex items-center gap-2">
              <VerseTool
                selectedVerses={selectedVerses}
                getSelectedText={getSelectedText}
                onClearSelection={clearSelection}
                isDarkMode={isDarkMode}
              />
              
              {/* Theme Toggle */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 text-brass-light hover:text-cream transition-colors"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-2 text-brass-light hover:text-cream transition-colors"
                title="Toggle Navigation"
              >
                <Settings size={20} />
              </button>
            </div>
          </div>
        </div>
        
        {/* Secondary Header - Version Selector */}
        <div className="flex items-center justify-center p-4">
          <VersionSelector
            currentVersion={currentVersion}
            onVersionChange={handleVersionChange}
            isDarkMode={isDarkMode}
          />
        </div>

        {/* Tab Navigation */}
        <div className={`flex border-t ${
          isDarkMode ? 'border-gray-600' : 'border-brass/20'
        }`}>
          <button
            onClick={() => setActiveTab('read')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'read'
                ? isDarkMode
                  ? 'text-white bg-blue-600/30 border-b-2 border-blue-400'
                  : 'text-cream bg-brass/20 border-b-2 border-brass'
                : isDarkMode
                  ? 'text-gray-400 hover:text-white'
                  : 'text-brass-light hover:text-cream'
            }`}
          >
            Read
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'search'
                ? isDarkMode
                  ? 'text-white bg-blue-600/30 border-b-2 border-blue-400'
                  : 'text-cream bg-brass/20 border-b-2 border-brass'
                : isDarkMode
                  ? 'text-gray-400 hover:text-white'
                  : 'text-brass-light hover:text-cream'
            }`}
          >
            Search
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-180px)]">
        {/* Navigation Sidebar */}
        <NavigationSidebar
          collapsed={sidebarCollapsed}
          currentBook={currentBook}
          currentChapter={currentChapter}
          onNavigate={handleNavigation}
          onReferenceJump={handleReferenceJump}
          isDarkMode={isDarkMode}
        />

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col min-h-0 ${
          isDarkMode ? 'bible-reader-content-dark' : 'bible-reader-content'
        }`}>
          {activeTab === 'read' ? (
            <ChapterDisplay
              book={currentBook}
              chapter={currentChapter}
              version={currentVersion}
              chapterData={chapterData}
              loading={navLoading}
              error={navError}
              selectedVerses={selectedVerses}
              onVerseSelect={selectVerse}
              onNavigate={handleNavigation}
              isDarkMode={isDarkMode}
            />
          ) : (
            <SearchInterface
              query={searchQuery}
              results={searchResults}
              searching={searching}
              version={currentVersion}
              onSearch={handleSearch}
              onClearSearch={clearSearch}
              onReferenceClick={handleReferenceJump}
              isDarkMode={isDarkMode}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default BibleReader;