import { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';

export const useContentManagement = () => {
  const [categories, setCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('sermons');
  const [categoryContent, setCategoryContent] = useState([]);
  const [allContent, setAllContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [storageUsage, setStorageUsage] = useState({});
  const [updatingTags, setUpdatingTags] = useState(new Set());
  
  // Content viewer state
  const [showContentViewer, setShowContentViewer] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [selectedContentForSummary, setSelectedContentForSummary] = useState(null);
  const [selectedContentId, setSelectedContentId] = useState(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiAnalysisFailed, setAiAnalysisFailed] = useState(false);

  // Load initial library data
  const loadLibraryData = async (skipCategoryLoad = false) => {
    setLoading(true);
    setError('');
    
    try {
      console.log('📚 Loading library stacks data...');
      
      // Use mock data instead of API calls
      const usage = {
        total_bytes: 0,
        item_count: 0,
        formatted: {
          total_size: "0 B",
          percentage_used: 0
        }
      };
      
      // Load counts for ALL categories to fix the count bug
      const mockCategories = {
        sermons: { name: 'Sermons', icon: '📜', count: 0, totalSizeBytes: 0 },
        'study-notes': { name: 'Study Notes', icon: '📖', count: 0, totalSizeBytes: 0 },
        research: { name: 'Research', icon: '🔍', count: 0, totalSizeBytes: 0 },
        journal: { name: 'Journal', icon: '📔', count: 0, totalSizeBytes: 0 },
        'social-media-posts': { name: 'Social Media Posts', icon: '💬', count: 0, totalSizeBytes: 0 }
      };
      
      // Load actual counts for each category
      for (const [categoryKey, category] of Object.entries(mockCategories)) {
        try {
          const response = await apiService.listContent(categoryKey, 50, 0);
          const content = response.items || [];
          mockCategories[categoryKey].count = content.length;
        } catch (err) {
          console.error(`Failed to load ${categoryKey} count:`, err);
        }
      }
      
      setStorageUsage(usage);
      setCategories(mockCategories);
      
      // Load default category content only on initial load
      if (!skipCategoryLoad) {
        await loadCategoryContent('sermons');
      }
      
      console.log('✅ Library stacks data loaded');
    } catch (err) {
      console.error('❌ Failed to load library stacks:', err);
      setError('Failed to load library data. Please refresh the page and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Refresh just the category counts without affecting scroll
  const refreshCategoryCounts = async () => {
    try {
      console.log('🔄 Refreshing category counts...');
      
      const updatedCategories = { ...categories };
      
      // Load actual counts for each category
      for (const [categoryKey, category] of Object.entries(updatedCategories)) {
        try {
          const response = await apiService.listContent(categoryKey, 50, 0);
          const content = response.items || [];
          updatedCategories[categoryKey].count = content.length;
        } catch (err) {
          console.error(`Failed to load ${categoryKey} count:`, err);
        }
      }
      
      setCategories(updatedCategories);
      console.log('✅ Category counts refreshed');
    } catch (err) {
      console.error('❌ Failed to refresh category counts:', err);
    }
  };

  // Load content for a specific category
  const loadCategoryContent = async (categoryKey) => {
    try {
      const response = await apiService.listContent(categoryKey, 50, 0);
      const content = response.items || [];
      setCategoryContent(content);
      
      // Update category count
      setCategories(prev => ({
        ...prev,
        [categoryKey]: {
          ...(prev[categoryKey] || {}),
          count: content.length
        }
      }));
    } catch (err) {
      console.error(`Failed to load ${categoryKey} content:`, err);
      setCategoryContent([]);
    }
  };

  // Load all content across categories for list view
  const loadAllContent = async () => {
    try {
      console.log('📚 Loading all content for list view...');
      const categoryKeys = ['sermons', 'study-notes', 'research', 'journal', 'social-media-posts'];
      let allItems = [];
      
      for (const categoryKey of categoryKeys) {
        try {
          const response = await apiService.listContent(categoryKey, 50, 0);
          const items = response.items || [];
          
          // Add category to each item
          const itemsWithCategory = items.map(item => ({
            ...item,
            category: categoryKey
          }));
          
          allItems = [...allItems, ...itemsWithCategory];
        } catch (err) {
          console.error(`Failed to load ${categoryKey} content:`, err);
        }
      }
      
      setAllContent(allItems);
      console.log(`✅ Loaded ${allItems.length} total items across all categories`);
      
      return allItems;
    } catch (err) {
      console.error('❌ Failed to load all content:', err);
      setAllContent([]);
      return [];
    }
  };

  // Handle tag updates
  const handleTagsChange = async (contentId, newTags, newPostTags = null) => {
    try {
      setUpdatingTags(prev => new Set([...prev, contentId]));
      
      // Try to use the new updateContentTags method
      await apiService.updateContentTags(contentId, newTags, newPostTags);
      
      console.log('✅ Tags updated successfully');
      
      // Update local state for both category content and all content
      const updateFunction = (item) => 
        item.id === contentId 
          ? { ...item, tags: newTags, post_tags: newPostTags || item.post_tags }
          : item;
      
      setCategoryContent(prev => prev.map(updateFunction));
      setAllContent(prev => prev.map(updateFunction));
      
      // If we have a selected content for summary, update it too
      if (selectedContentForSummary && selectedContentForSummary.id === contentId) {
        setSelectedContentForSummary(prev => ({ 
          ...prev, 
          tags: newTags, 
          post_tags: newPostTags || prev.post_tags 
        }));
      }
      
    } catch (error) {
      console.error('Failed to update tags:', error);
      alert('Failed to update tags. Please try again.');
    } finally {
      setUpdatingTags(prev => {
        const next = new Set(prev);
        next.delete(contentId);
        return next;
      });
    }
  };

  // Handle content actions (edit, delete, share, etc.)
  const handleContentAction = async (action, item) => {
    switch (action) {
      case 'edit':
        // Store content in localStorage for StudyHall
        localStorage.setItem('editingContent', JSON.stringify({
          id: item.id,
          title: item.title,
          content: item.content,
          category: item.category
        }));
        
        // Navigate to StudyHall
        // Note: navigate function should be passed from parent component
        break;

      case 'delete':
        if (window.confirm(`Are you sure you want to delete "${item.title}"?`)) {
          try {
            await apiService.deleteContent(item.id);
            console.log('✅ Content deleted successfully');
            
            // Remove from local state
            setCategoryContent(prev => prev.filter(c => c.id !== item.id));
            setAllContent(prev => prev.filter(c => c.id !== item.id));
            
            // Refresh category counts
            await refreshCategoryCounts();
          } catch (error) {
            console.error('Failed to delete content:', error);
            alert('Failed to delete content. Please try again.');
          }
        }
        break;

      case 'view':
        setSelectedContent(item);
        setShowContentViewer(true);
        break;

      case 'download':
        await handleDownload(item);
        break;

      case 'share':
        // Implement sharing logic
        break;

      case 'summary':
        await handleArtifactSelect(item);
        break;

      default:
        console.log(`Unknown action: ${action}`);
    }
  };

  // Handle artifact selection for AI analysis
  const handleArtifactSelect = async (item) => {
    console.log('🔍 Selected artifact for analysis:', item.title);
    setSelectedContentForSummary(item);
    setSelectedContentId(item.id);
    setAiAnalysisLoading(true);
    setAiAnalysisFailed(false);
    
    try {
      // Fetch complete content if not already loaded
      if (!item.content || typeof item.content !== 'string') {
        console.log('📥 Fetching complete content data...');
        try {
          const updatedContent = await apiService.getContent(item.id);
          setSelectedContentForSummary(updatedContent);
          console.log('✅ Complete content loaded');
        } catch (fetchError) {
          console.error('Failed to fetch complete content:', fetchError);
          setAiAnalysisFailed(true);
          return;
        }
      }
      
      console.log('✅ Content ready for analysis');
    } catch (error) {
      console.error('Analysis failed:', error);
      setAiAnalysisFailed(true);
    } finally {
      setAiAnalysisLoading(false);
    }
  };

  // Handle file download
  const handleDownload = async (item) => {
    try {
      console.log('⬇️ Downloading content:', item.title);
      
      // Get the content
      const content = item.content || '';
      const filename = item.filename || `${item.title}.txt`;
      
      // Create blob and download
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      console.log('✅ Download initiated');
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  // Handle category change
  const handleCategoryChange = async (newCategory) => {
    setSelectedCategory(newCategory);
    await loadCategoryContent(newCategory);
  };

  // Initialize on mount
  useEffect(() => {
    loadLibraryData();
  }, []);

  return {
    // State
    categories,
    selectedCategory,
    categoryContent,
    allContent,
    loading,
    error,
    storageUsage,
    updatingTags,
    showContentViewer,
    selectedContent,
    selectedContentForSummary,
    selectedContentId,
    aiAnalysisLoading,
    aiAnalysisFailed,

    // Actions
    loadLibraryData,
    refreshCategoryCounts,
    loadCategoryContent,
    loadAllContent,
    handleTagsChange,
    handleContentAction,
    handleArtifactSelect,
    handleDownload,
    handleCategoryChange,

    // Setters
    setShowContentViewer,
    setSelectedContent,
    setSelectedContentForSummary,
    setSelectedContentId,
    setSelectedCategory,
    setError
  };
};