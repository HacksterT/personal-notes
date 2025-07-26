import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Book, 
  Search, 
  ArrowRight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const NavigationSidebar = ({ 
  collapsed, 
  currentBook, 
  currentChapter, 
  onNavigate, 
  onReferenceJump,
  isDarkMode = false
}) => {
  const [quickReference, setQuickReference] = useState('');
  const [expandedTestament, setExpandedTestament] = useState('old');
  
  // Bible books organized by testament
  const oldTestament = [
    'Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy',
    'Joshua', 'Judges', 'Ruth', '1 Samuel', '2 Samuel',
    '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles',
    'Ezra', 'Nehemiah', 'Esther', 'Job', 'Psalms', 'Proverbs',
    'Ecclesiastes', 'Song of Solomon', 'Isaiah', 'Jeremiah',
    'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel',
    'Amos', 'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk',
    'Zephaniah', 'Haggai', 'Zechariah', 'Malachi'
  ];

  const newTestament = [
    'Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans',
    '1 Corinthians', '2 Corinthians', 'Galatians', 'Ephesians',
    'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
    '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews',
    'James', '1 Peter', '2 Peter', '1 John', '2 John',
    '3 John', 'Jude', 'Revelation'
  ];

  // Handle quick reference jump
  const handleQuickReference = (e) => {
    e.preventDefault();
    if (quickReference.trim()) {
      onReferenceJump(quickReference.trim());
      setQuickReference('');
    }
  };

  // Get chapter numbers for a book (simplified - in real app, use API)
  const getChapterCount = (book) => {
    const chapterCounts = {
      'Genesis': 50, 'Exodus': 40, 'Psalms': 150, 'Matthew': 28,
      'Mark': 16, 'Luke': 24, 'John': 21, 'Acts': 28, 'Romans': 16
      // Add more as needed
    };
    return chapterCounts[book] || 25; // Default fallback
  };

  if (collapsed) {
    return (
      <div className={`w-12 flex flex-col items-center py-4 space-y-4 ${
        isDarkMode ? 'bible-nav-sidebar-dark' : 'bible-nav-sidebar'
      }`}>
        <Book size={20} className="text-brass" />
      </div>
    );
  }

  return (
    <div className={`w-80 flex flex-col ${
      isDarkMode ? 'bible-nav-sidebar-dark' : 'bible-nav-sidebar'
    }`}>
      {/* Quick Reference */}
      <div className="p-4 border-b border-brass/20">
        <form onSubmit={handleQuickReference} className="space-y-2">
          <label className="text-sm text-brass-light">Quick Reference</label>
          <div className="flex">
            <input
              type="text"
              placeholder="John 3:16 or Psalm 23"
              value={quickReference}
              onChange={(e) => setQuickReference(e.target.value)}
              className="flex-1 px-3 py-2 bg-dark-wood border border-brass/30 rounded-l text-cream placeholder-brass-light/60 focus:outline-none focus:border-brass"
            />
            <button
              type="submit"
              className="px-3 py-2 bg-brass/20 border border-l-0 border-brass/30 rounded-r text-brass hover:bg-brass/30 transition-colors"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>

      {/* Current Location */}
      <div className="p-4 border-b border-brass/20">
        <div className="text-sm text-brass-light mb-2">Current Location</div>
        <div className="text-cream font-medium">
          {currentBook} {currentChapter}
        </div>
        
        {/* Chapter Navigation */}
        <div className="flex items-center justify-between mt-2">
          <button
            onClick={() => onNavigate(currentBook, Math.max(1, currentChapter - 1))}
            disabled={currentChapter <= 1}
            className="p-1 text-brass-light hover:text-cream disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>
          
          <span className="text-sm text-brass-light">
            Chapter {currentChapter}
          </span>
          
          <button
            onClick={() => onNavigate(currentBook, currentChapter + 1)}
            className="p-1 text-brass-light hover:text-cream"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Book Navigation */}
      <div className="flex-1 overflow-y-auto">
        {/* Old Testament */}
        <div className="border-b border-brass/20">
          <button
            onClick={() => setExpandedTestament(expandedTestament === 'old' ? '' : 'old')}
            className="w-full flex items-center justify-between p-3 text-brass-light hover:text-cream hover:bg-brass/10"
          >
            <span className="font-medium">Old Testament</span>
            {expandedTestament === 'old' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {expandedTestament === 'old' && (
            <div className="pb-2">
              {oldTestament.map(book => (
                <button
                  key={book}
                  onClick={() => onNavigate(book, 1)}
                  className={`w-full text-left px-6 py-1.5 text-sm transition-colors ${
                    currentBook === book 
                      ? 'text-brass bg-brass/20' 
                      : 'text-brass-light hover:text-cream hover:bg-brass/10'
                  }`}
                >
                  {book}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* New Testament */}
        <div>
          <button
            onClick={() => setExpandedTestament(expandedTestament === 'new' ? '' : 'new')}
            className="w-full flex items-center justify-between p-3 text-brass-light hover:text-cream hover:bg-brass/10"
          >
            <span className="font-medium">New Testament</span>
            {expandedTestament === 'new' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
          
          {expandedTestament === 'new' && (
            <div className="pb-2">
              {newTestament.map(book => (
                <button
                  key={book}
                  onClick={() => onNavigate(book, 1)}
                  className={`w-full text-left px-6 py-1.5 text-sm transition-colors ${
                    currentBook === book 
                      ? 'text-brass bg-brass/20' 
                      : 'text-brass-light hover:text-cream hover:bg-brass/10'
                  }`}
                >
                  {book}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NavigationSidebar;