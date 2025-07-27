import { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';

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

  // Handle search
  const handleSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await apiService.searchContent(query, null, 20);
      const results = response.items || [];
      setSearchResults(results);
    } catch (err) {
      console.error('Search failed:', err);
      setSearchResults([]);
    }
  };

  // Sort content function
  const sortContent = (content, sortBy) => {
    if (!content || content.length === 0) return content;
    
    const sortedContent = [...content];
    
    switch (sortBy) {
      case 'title':
        return sortedContent.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        
      case 'category':
        return sortedContent.sort((a, b) => (a.category || '').localeCompare(b.category || ''));
        
      case 'date':
      default:
        return sortedContent.sort((a, b) => {
          const aDate = new Date(a.date_modified || a.date_created || 0);
          const bDate = new Date(b.date_modified || b.date_created || 0);
          return bDate - aDate; // Most recent first
        });
    }
  };

  // Filter content by multiple tags
  const filterContentByMultiTags = (content, filters) => {
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
  };

  // Filter content by filter mode
  const filterContentByMode = (content, mode) => {
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
  };

  // Get all available tags from content
  const getAllAvailableTags = (content) => {
    const allTags = new Set();
    content.forEach(item => {
      if (item.tags) {
        item.tags.forEach(tag => allTags.add(tag));
      }
    });
    return Array.from(allTags).sort();
  };

  // Handle multi-tag filter changes
  const handleMultiTagChange = (index, tag) => {
    setMultiTagFilters(prev => 
      prev.map((filter, i) => 
        i === index ? { ...filter, tag } : filter
      )
    );
  };

  const handleMultiTagOperatorChange = (index, operator) => {
    setMultiTagFilters(prev => 
      prev.map((filter, i) => 
        i === index ? { ...filter, operator } : filter
      )
    );
  };

  // Apply all filters and sorting to content
  const processContent = (rawContent) => {
    let processedContent = [...rawContent];
    
    // Apply filter mode
    processedContent = filterContentByMode(processedContent, filterMode);
    
    // Apply tag filters
    processedContent = filterContentByMultiTags(processedContent, multiTagFilters);
    
    // Apply sorting
    processedContent = sortContent(processedContent, sortMode);
    
    return processedContent;
  };

  // Clear all filters
  const clearFilters = () => {
    setFilterMode('all');
    setMultiTagFilters([
      { tag: '', operator: 'AND' },
      { tag: '', operator: 'AND' },
      { tag: '', operator: 'OR' }
    ]);
    setSearchQuery('');
    setSearchResults([]);
  };

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