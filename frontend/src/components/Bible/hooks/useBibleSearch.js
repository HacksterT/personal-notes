import { useState, useCallback } from 'react';
import { bibleService } from '../../../services/bibleService';

export const useBibleSearch = (version = 'NLT') => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  // Perform search
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearchQuery(query);
    setSearching(true);
    setError(null);

    try {
      // Call real backend Bible service
      const results = await bibleService.searchText(query, version);
      setSearchResults(results);
    } catch (err) {
      setError(err.message || 'Search failed');
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, [version]);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setSearchResults([]);
    setError(null);
  }, []);

  return {
    searchQuery,
    searchResults,
    searching,
    error,
    performSearch,
    clearSearch
  };
};