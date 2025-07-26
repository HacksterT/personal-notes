import React, { useState } from 'react';
import { Search, X, Loader2, ExternalLink } from 'lucide-react';

const SearchInterface = ({
  query,
  results,
  searching,
  version,
  onSearch,
  onClearSearch,
  onReferenceClick,
  isDarkMode = false
}) => {
  const [searchInput, setSearchInput] = useState(query || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearch(searchInput.trim());
    }
  };

  const handleClear = () => {
    setSearchInput('');
    onClearSearch();
  };

  const handleResultClick = (result) => {
    onReferenceClick(result.reference);
  };

  return (
    <div className="flex-1 flex flex-col bg-transparent">
      {/* Search Header */}
      <div className={`p-4 ${
        isDarkMode ? 'bible-search-header-dark' : 'bible-search-header'
      }`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input
                type="text"
                placeholder="Search the Bible..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className={`w-full px-4 py-3 pl-10 rounded-lg ${
                  isDarkMode ? 'bible-search-input-dark' : 'bible-search-input'
                }`}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brass-light" size={18} />
            </div>
            
            <button
              type="submit"
              disabled={searching || !searchInput.trim()}
              className="px-6 py-3 bg-brass text-dark-wood font-medium rounded-lg hover:bg-brass-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {searching ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                'Search'
              )}
            </button>
            
            {(query || searchInput) && (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-3 bg-dark-wood border border-brass/30 text-brass-light rounded-lg hover:bg-brass/10 transition-colors"
                title="Clear search"
              >
                <X size={18} />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-4 text-sm text-brass-light">
            <span>Searching in: {version}</span>
            {results.length > 0 && (
              <span>{results.length} result{results.length > 1 ? 's' : ''} found</span>
            )}
          </div>
        </form>
      </div>

      {/* Search Results */}
      <div className="flex-1 overflow-y-auto">
        {searching ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader2 className="mx-auto mb-4 text-brass animate-spin" size={32} />
              <p className="text-brass-light">Searching...</p>
            </div>
          </div>
        ) : results.length > 0 ? (
          <div className="p-4 space-y-4">
            {results.map((result, index) => (
              <div
                key={`${result.reference}-${index}`}
                className={`rounded-lg p-4 cursor-pointer ${
                  isDarkMode ? 'bible-search-result-dark' : 'bible-search-result'
                }`}
                onClick={() => handleResultClick(result)}
              >
                {/* Reference Header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-brass font-medium">
                    {result.reference}
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-brass-light bg-brass/20 px-2 py-1 rounded">
                      {result.version}
                    </span>
                    <ExternalLink size={16} className="text-brass-light" />
                  </div>
                </div>
                
                {/* Verse Text */}
                <p className="text-cream leading-relaxed">
                  {result.text}
                </p>
                
                {/* Click hint */}
                <div className="mt-3 text-xs text-brass-light/70">
                  Click to navigate to this passage
                </div>
              </div>
            ))}
          </div>
        ) : query ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-brass-light">
              <p className="mb-2">No results found for "{query}"</p>
              <p className="text-sm opacity-70">Try different search terms</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-brass-light">
              <Search className="mx-auto mb-4 text-brass/50" size={48} />
              <p className="mb-2">Search the Bible</p>
              <p className="text-sm opacity-70">Enter keywords to find verses</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchInterface;