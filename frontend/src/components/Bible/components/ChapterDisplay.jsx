import React from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

const ChapterDisplay = ({
  book,
  chapter,
  version,
  chapterData,
  loading,
  error,
  selectedVerses,
  onVerseSelect,
  onNavigate,
  isDarkMode = false
}) => {
  if (loading) {
    return (
      <div className={`flex-1 flex items-center justify-center ${
        isDarkMode ? 'bg-gray-800' : 'bg-transparent'
      }`}>
        <div className="text-center">
          <Loader2 className={`mx-auto mb-4 animate-spin ${
            isDarkMode ? 'text-blue-400' : 'text-brass'
          }`} size={32} />
          <p className={isDarkMode ? 'text-gray-300' : 'text-brass-light'}>
            Loading {book} {chapter}...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex-1 flex items-center justify-center ${
        isDarkMode ? 'bg-gray-800' : 'bg-transparent'
      }`}>
        <div className="text-center text-red-400">
          <p className="mb-2">Error loading chapter</p>
          <p className="text-sm opacity-70">{error}</p>
        </div>
      </div>
    );
  }

  if (!chapterData) {
    return (
      <div className={`flex-1 flex items-center justify-center ${
        isDarkMode ? 'bg-gray-800' : 'bg-transparent'
      }`}>
        <p className={isDarkMode ? 'text-gray-300' : 'text-brass-light'}>
          Select a chapter to begin reading
        </p>
      </div>
    );
  }

  const handleVerseClick = (verseNumber) => {
    const verseKey = `${book}.${chapter}.${verseNumber}`;
    onVerseSelect(verseKey);
  };

  return (
    <div className={`flex-1 flex flex-col ${
      isDarkMode ? 'bg-gray-800' : 'bg-transparent'
    }`}>
      {/* Chapter Header */}
      <div className={`border-b p-4 ${
        isDarkMode 
          ? 'bg-gray-900 border-gray-600' 
          : 'bg-dark-wood/40 border-brass/20'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-2xl font-cormorant ${
              isDarkMode ? 'text-white' : 'text-cream'
            }`}>
              {book} {chapter}
            </h2>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-brass-light'
            }`}>{version}</p>
          </div>
          
          {/* Chapter Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate(book, Math.max(1, chapter - 1))}
              disabled={chapter <= 1}
              className={`p-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-brass-light hover:text-cream'
              }`}
              title="Previous Chapter"
            >
              <ChevronLeft size={20} />
            </button>
            
            <span className={`px-3 py-1 text-sm rounded ${
              isDarkMode 
                ? 'bg-gray-700 text-gray-200' 
                : 'bg-brass/20 text-brass'
            }`}>
              Chapter {chapter}
            </span>
            
            <button
              onClick={() => onNavigate(book, chapter + 1)}
              className={`p-2 transition-colors ${
                isDarkMode 
                  ? 'text-gray-400 hover:text-white' 
                  : 'text-brass-light hover:text-cream'
              }`}
              title="Next Chapter"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Chapter Content - Traditional Bible Layout */}
      <div className="flex-1 overflow-y-auto py-8 px-6 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-transparent">
        <div className="max-w-4xl mx-auto">
          {/* Chapter Header with Traditional Formatting */}
          <div className="mb-6">
            {/* Large Chapter Number */}
            <div className="mb-4">
              <span className={`text-6xl font-bold mr-4 ${
                isDarkMode ? 'text-gray-400' : 'text-brass/70'
              }`}>
                {chapter}
              </span>
              {/* Chapter subtitle/description if available */}
              {chapterData.subtitle && (
                <span className={`text-lg italic ${
                  isDarkMode ? 'text-gray-300' : 'text-cream/80'
                }`}>
                  {chapterData.subtitle}
                </span>
              )}
            </div>
          </div>

          {/* Verses as Flowing Text with Proper Hanging Indent */}
          <div className={`leading-7 text-lg select-text ${
            isDarkMode ? 'text-gray-100' : 'text-cream'
          }`}>
            {chapterData.verses?.map((verse, index) => {
              const verseKey = `${book}.${chapter}.${verse.number}`;
              const isSelected = selectedVerses.has(verseKey);
              
              return (
                <div 
                  key={verse.number} 
                  className={`mb-2 cursor-pointer transition-colors rounded px-1 -mx-1 ${
                    isSelected 
                      ? isDarkMode 
                        ? 'bg-blue-900/20' 
                        : 'bg-brass/15'
                      : 'hover:bg-black/5'
                  }`}
                  onClick={() => handleVerseClick(verse.number)}
                  style={{
                    textIndent: '-2em',
                    paddingLeft: '2em'
                  }}
                >
                  {/* Verse Number - Small and Subtle */}
                  <span
                    className={`text-sm font-medium cursor-pointer select-none mr-2 ${
                      isSelected 
                        ? isDarkMode 
                          ? 'text-blue-400' 
                          : 'text-brass'
                        : isDarkMode 
                          ? 'text-gray-500' 
                          : 'text-brass/60'
                    }`}
                    onClick={(e) => {
                      e.preventDefault();
                      handleVerseClick(verse.number);
                    }}
                    title={`Select verse ${verse.number}`}
                  >
                    {verse.number}
                  </span>
                  
                  {/* Verse Text - Will wrap with proper hanging indent */}
                  <span className="inline">
                    {verse.text}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`border-t p-4 ${
        isDarkMode 
          ? 'bg-gray-900 border-gray-600' 
          : 'bg-dark-wood/40 border-brass/20'
      }`}>
        <div className={`flex items-center justify-between text-sm ${
          isDarkMode ? 'text-gray-400' : 'text-brass-light'
        }`}>
          <div>
            {selectedVerses.size > 0 && (
              <span>{selectedVerses.size} verse{selectedVerses.size > 1 ? 's' : ''} selected</span>
            )}
          </div>
          <div>
            {chapterData.verses?.length} verses
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChapterDisplay;