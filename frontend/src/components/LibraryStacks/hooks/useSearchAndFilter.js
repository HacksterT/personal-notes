/**
 * useSearchAndFilter Hook
 * 
 * This hook manages all search and filtering functionality for the LibraryStacks component.
 * It handles:
 * - Content searching with API integration
 * - View mode toggling (cards/list)
 * - Content filtering by recency, favorites, or shared status
 * - Content sorting by date, title, or category
 * - Multi-tag filtering with AND/OR operators
 * - Processing and combining all filters for content display
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { apiService } from '../../../services/api';
import { useErrorHandler } from './useErrorHandler';

export const useSearchAndFilter = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'list'
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'recent', 'favorites', 'shared'
  const [sortMode, setSortMode] = useState('date'); // 'date', 'title', 'category'
  const [multiTagFilters, setMultiTagFilters] = useState([
    { tag: '', operator: 'AND' },
    { tag: '', operator: 'AND' },
    { tag: '', operator: 'OR' }
  ]);
  
  // Enhanced error handling
  const errorHandler = useErrorHandler();

  // Handle search with useCallback optimization and enhanced error handling
  const handleSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await errorHandler.handleAsyncOperation(
        () => apiService.searchContent(query, null, 20),
        'Searching content',
        { critical: false, errorKey: 'search', showToast: true }
      );
      const results = response.items || [];
      setSearchResults(results);
    } catch (err) {
      // Error already handled by errorHandler, just clear results
      setSearchResults([]);
    }
  }, [errorHandler]);

  // Sort content function with useCallback optimization and secondary sorting
  const sortContent = useCallback((content, sortBy) => {
    if (!content || content.length === 0) return content;
    
    const sortedContent = [...content];
    
    switch (sortBy) {
      case 'title':
        return sortedContent.sort((a, b) => {
          const titleA = (a.title || '').toLowerCase();
          const titleB = (b.title || '').toLowerCase();
          const titleCompare = titleA.localeCompare(titleB);
          
          // Secondary sort by date if titles are equal
          if (titleCompare === 0) {
            const aDate = new Date(a.date_modified || a.date_created || 0);
            const bDate = new Date(b.date_modified || b.date_created || 0);
            return bDate - aDate; // Most recent first
          }
          return titleCompare;
        });
        
      case 'category':
        return sortedContent.sort((a, b) => {
          const categoryA = (a.category || '').toLowerCase();
          const categoryB = (b.category || '').toLowerCase();
          const categoryCompare = categoryA.localeCompare(categoryB);
          
          // Secondary sort by title if categories are equal
          if (categoryCompare === 0) {
            const titleA = (a.title || '').toLowerCase();
            const titleB = (b.title || '').toLowerCase();
            return titleA.localeCompare(titleB);
          }
          return categoryCompare;
        });
        
      case 'date':
      default:
        return sortedContent.sort((a, b) => {
          // Improved date handling with proper fallbacks
          const aModified = a.date_modified;
          const aCreated = a.date_created;
          const bModified = b.date_modified;
          const bCreated = b.date_created;
          
          // Use modified date if available, otherwise created date, otherwise epoch
          const aDate = new Date(aModified || aCreated || '1970-01-01');
          const bDate = new Date(bModified || bCreated || '1970-01-01');
          
          const dateCompare = bDate - aDate; // Most recent first
          
          // Secondary sort by title if dates are equal
          if (dateCompare === 0) {
            const titleA = (a.title || '').toLowerCase();
            const titleB = (b.title || '').toLowerCase();
            return titleA.localeCompare(titleB);
          }
          return dateCompare;
        });
    }
  }, []);

  // Filter content by multiple tags with useCallback optimization
  const filterContentByMultiTags = useCallback((content, filters) => {
    // Get active filters (those with a tag selected)
    const activeFilters = filters.filter(filter => filter.tag && filter.tag.trim() !== '');
    
    if (activeFilters.length === 0) return content;
    
    return content.filter(item => {
      if (!item.tags || item.tags.length === 0) return false;
      
      const andFilters = activeFilters.filter(f => f.operator === 'AND');
      const orFilters = activeFilters.filter(f => f.operator === 'OR');
      
      // ALL AND filters must match
      const andMatches = andFilters.every(filter => 
        item.tags.some(itemTag => 
          itemTag.toLowerCase().includes(filter.tag.toLowerCase())
        )
      );
      
      // At least ONE OR filter must match (if any OR filters exist)
      const orMatches = orFilters.length === 0 || orFilters.some(filter => 
        item.tags.some(itemTag => 
          itemTag.toLowerCase().includes(filter.tag.toLowerCase())
        )
      );
      
      return andMatches && orMatches;
    });
  }, []);

  // Filter content by filter mode with useCallback optimization
  const filterContentByMode = useCallback((content, mode) => {
    switch (mode) {
      case 'recent':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return content.filter(item => {
          const itemDate = new Date(item.date_modified || item.date_created);
          return itemDate >= weekAgo;
        });
        
      case 'favorites':
        // Implement favorites logic if needed
        return content.filter(item => item.is_favorite);
        
      case 'shared':
        // Implement shared logic if needed
        return content.filter(item => item.is_shared);
        
      case 'all':
      default:
        return content;
    }
  }, []);

  // Get all available tags from content with useCallback optimization
  const getAllAvailableTags = useCallback((content) => {
    const allTags = new Set();
    content.forEach(item => {
      if (item.tags) {
        item.tags.forEach(tag => allTags.add(tag));
      }
    });
    return Array.from(allTags).sort();
  }, []);

  // Handle multi-tag filter changes with useCallback optimization
  const handleMultiTagChange = useCallback((index, tag) => {
    setMultiTagFilters(prev => 
      prev.map((filter, i) => 
        i === index ? { ...filter, tag } : filter
      )
    );
  }, []);

  const handleMultiTagOperatorChange = useCallback((index, operator) => {
    setMultiTagFilters(prev => 
      prev.map((filter, i) => 
        i === index ? { ...filter, operator } : filter
      )
    );
  }, []);

  // Apply all filters and sorting to content with useCallback optimization
  const processContent = useCallback((rawContent) => {
    let processedContent = [...rawContent];
    
    // Apply filter mode
    processedContent = filterContentByMode(processedContent, filterMode);
    
    // Apply tag filters
    processedContent = filterContentByMultiTags(processedContent, multiTagFilters);
    
    // Apply sorting
    processedContent = sortContent(processedContent, sortMode);
    
    return processedContent;
  }, [filterMode, multiTagFilters, sortMode, filterContentByMode, filterContentByMultiTags, sortContent]);

  // Clear all filters with useCallback optimization
  const clearFilters = useCallback(() => {
    setFilterMode('all');
    setMultiTagFilters([
      { tag: '', operator: 'AND' },
      { tag: '', operator: 'AND' },
      { tag: '', operator: 'OR' }
    ]);
    setSearchQuery('');
    setSearchResults([]);
  }, []);

  // Auto-search when query changes (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch(searchQuery);
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  return {
    // State
    searchQuery,
    searchResults,
    viewMode,
    filterMode,
    sortMode,
    multiTagFilters,

    // Actions
    setSearchQuery,
    handleSearch,
    setViewMode,
    setFilterMode,
    setSortMode,
    handleMultiTagChange,
    handleMultiTagOperatorChange,
    clearFilters,

    // Utility functions
    sortContent,
    filterContentByMultiTags,
    filterContentByMode,
    getAllAvailableTags,
    processContent
  };
};