import React from 'react';
import { Search, X } from 'lucide-react';

const SearchBar = ({ searchQuery, onSearchChange, onClearSearch }) => {
  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-wood-dark/40" />
      </div>
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="Search content..."
        className="block w-full pl-10 pr-10 py-2 border border-wood-light/30 rounded-lg focus:ring-2 focus:ring-brass/50 focus:border-brass text-wood-dark placeholder-wood-dark/60"
      />
      {searchQuery && (
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          <button
            onClick={onClearSearch}
            className="text-wood-dark/40 hover:text-wood-dark/60"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchBar;