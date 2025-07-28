/**
 * useContentManagement Hook
 * 
 * This hook manages all content-related functionality for the LibraryStacks component.
 * It handles:
 * - Loading and managing category data and content
 * - Content operations (view, edit, delete, download, share)
 * - Tag management for content items
 * - Content viewer state management
 * - AI analysis integration for content summaries
 * - Storage usage tracking
 * - Error handling for content operations
 */

import { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';
import { useErrorHandler } from './useErrorHandler';
import { jsPDF } from 'jspdf';

export const useContentManagement = () => {
  const [categories, setCategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('sermons');
  const [categoryContent, setCategoryContent] = useState([]);
  const [allContent, setAllContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [storageUsage, setStorageUsage] = useState({});
  const [updatingTags, setUpdatingTags] = useState(new Set());
  
  // Enhanced error handling
  const errorHandler = useErrorHandler();
  
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
      
      // Load actual counts for each category with enhanced error handling
      const categoryPromises = Object.entries(mockCategories).map(async ([categoryKey]) => {
        try {
          const response = await apiService.listContent(categoryKey, 50, 0);
          const content = response.items || [];
          return { categoryKey, count: content.length, success: true };
        } catch (err) {
          errorHandler.handleError(err, `Loading ${categoryKey} count`, { 
            critical: false, 
            errorKey: `category-${categoryKey}`,
            showToast: false 
          });
          return { categoryKey, count: 0, success: false };
        }
      });
      
      const results = await Promise.all(categoryPromises);
      results.forEach(({ categoryKey, count }) => {
        mockCategories[categoryKey].count = count;
      });
      
      setStorageUsage(usage);
      setCategories(mockCategories);
      
      // Load default category content only on initial load
      if (!skipCategoryLoad) {
        await loadCategoryContent('sermons');
      }
      
      console.log('✅ Library stacks data loaded');
    } catch (err) {
      const errorMessage = 'Failed to load library data. Please refresh the page and try again.';
      console.error('❌ Failed to load library stacks:', err);
      setError(errorMessage);
      errorHandler.handleError(err, 'Loading library data', { 
        critical: true, 
        errorKey: 'library-load' 
      });
    } finally {
      setLoading(false);
    }
  };

  // Refresh just the category counts without affecting scroll
  const refreshCategoryCounts = async () => {
    try {
      console.log('🔄 Refreshing category counts...');
      
      // CRITICAL FIX: Validate categories state before proceeding
      if (!categories || Object.keys(categories).length === 0) {
        console.log('⚠️ Categories state is empty/corrupted, re-initializing...');
        await loadLibraryData(true); // Skip category content load, just restore categories
        return;
      }
      
      const updatedCategories = { ...categories };
      let successCount = 0;
      const totalCategories = Object.keys(updatedCategories).length;
      
      // Load actual counts for each category
      for (const [categoryKey] of Object.entries(updatedCategories)) {
        try {
          const response = await apiService.listContent(categoryKey, 50, 0);
          const content = response.items || [];
          updatedCategories[categoryKey].count = content.length;
          successCount++;
        } catch (err) {
          console.error(`Failed to load ${categoryKey} count:`, err);
          // Keep existing count on individual failure
        }
      }
      
      // CRITICAL FIX: Only update categories if at least some API calls succeeded
      if (successCount > 0) {
        setCategories(updatedCategories);
        console.log(`✅ Category counts refreshed (${successCount}/${totalCategories} successful)`);
      } else {
        console.error('❌ All category refresh API calls failed, keeping existing categories');
      }
    } catch (err) {
      console.error('❌ Failed to refresh category counts:', err);
      // CRITICAL FIX: Don't update categories state on total failure
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
      
      // Update regular tags if provided
      if (newTags !== null && newTags !== undefined) {
        await apiService.updateContentTags(contentId, newTags);
        console.log('✅ Regular tags updated successfully');
      }
      
      // Update post_tags if provided (for social media posts)
      if (newPostTags !== null && newPostTags !== undefined) {
        await apiService.updateContentPostTags(contentId, newPostTags);
        console.log('✅ Post tags updated successfully');
      }
      
      console.log('✅ All tag updates completed');
      
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

  // Generate PDF from content
  const generatePDF = async (content, filename) => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      const maxLineWidth = pageWidth - 2 * margin;
      let currentY = margin;
      
      // Helper function to add text with word wrapping
      const addTextToPDF = (text, fontSize = 12, isBold = false) => {
        doc.setFontSize(fontSize);
        doc.setFont('helvetica', isBold ? 'bold' : 'normal');
        
        const lines = doc.splitTextToSize(text, maxLineWidth);
        
        for (const line of lines) {
          // Check if we need a new page
          if (currentY > doc.internal.pageSize.getHeight() - margin) {
            doc.addPage();
            currentY = margin;
          }
          
          doc.text(line, margin, currentY);
          currentY += fontSize * 0.6; // Line spacing
        }
        
        currentY += 5; // Extra spacing after paragraph
      };
      
      // Process content sections
      const sections = content.split('='.repeat(60));
      
      for (const section of sections) {
        const trimmedSection = section.trim();
        if (!trimmedSection) continue;
        
        const lines = trimmedSection.split('\n');
        
        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine) {
            currentY += 5; // Add spacing for empty lines
            continue;
          }
          
          // Check for headers (section titles)
          if (trimmedLine === 'KEY THEMES' || trimmedLine === 'THOUGHT QUESTIONS' || trimmedLine === 'CONTENT') {
            addTextToPDF(trimmedLine, 16, true);
          } else if (trimmedLine.match(/^\d+\./)) {
            // Numbered list items
            addTextToPDF(trimmedLine, 12, false);
          } else {
            // Regular content
            addTextToPDF(trimmedLine, 12, false);
          }
        }
      }
      
      // Save the PDF
      doc.save(`${filename}.pdf`);
      console.log('✅ PDF generated successfully');
    } catch (error) {
      console.error('PDF generation failed:', error);
      throw new Error('Failed to generate PDF. Please try downloading as text instead.');
    }
  };

  // Handle file download with AI analysis integration
  const handleDownload = async (item, format = 'txt') => {
    try {
      console.log('⬇️ Downloading content:', item.title, 'Format:', format);
      
      // Ensure we have complete content data including AI analysis
      let fullItem = item;
      if (!item.key_themes || !item.thought_questions) {
        try {
          console.log('📥 Fetching complete content with AI analysis...');
          fullItem = await apiService.getContent(item.id);
        } catch (fetchError) {
          console.warn('Could not fetch complete content, using available data:', fetchError);
          fullItem = item;
        }
      }
      
      // Build content structure with AI analysis at top
      let downloadContent = '';
      
      // Add AI Analysis section if available
      if (fullItem.key_themes && fullItem.key_themes.length > 0) {
        downloadContent += '='.repeat(60) + '\n';
        downloadContent += 'KEY THEMES\n';
        downloadContent += '='.repeat(60) + '\n\n';
        
        fullItem.key_themes.slice(0, 3).forEach((theme, index) => {
          downloadContent += `${index + 1}. ${theme}\n`;
        });
        downloadContent += '\n';
      }
      
      if (fullItem.thought_questions && fullItem.thought_questions.length > 0) {
        downloadContent += '='.repeat(60) + '\n';
        downloadContent += 'THOUGHT QUESTIONS\n';
        downloadContent += '='.repeat(60) + '\n\n';
        
        fullItem.thought_questions.forEach((question, index) => {
          downloadContent += `${index + 1}. ${question}\n`;
        });
        downloadContent += '\n';
      }
      
      // Add separator between AI analysis and content
      if (downloadContent) {
        downloadContent += '='.repeat(60) + '\n';
        downloadContent += 'CONTENT\n';
        downloadContent += '='.repeat(60) + '\n\n';
      }
      
      // Add main content
      downloadContent += fullItem.content || '';
      
      // Generate filename with format extension
      const baseFilename = fullItem.title.replace(/[<>:"/\\|?*]/g, '_'); // Sanitize filename
      const filename = `${baseFilename}.${format}`;
      
      // Handle different formats
      if (format === 'pdf' && fullItem.category === 'sermons') {
        // Generate PDF for sermons
        await generatePDF(downloadContent, filename.replace('.pdf', ''));
      } else {
        // Determine MIME type based on format
        let mimeType = 'text/plain';
        if (format === 'md') {
          mimeType = 'text/markdown';
        }
        
        // Create blob and download for text/markdown
        const blob = new Blob([downloadContent], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      console.log('✅ Download initiated with AI analysis included');
    } catch (error) {
      console.error('Download failed:', error);
      errorHandler.handleError(error, 'Downloading content', { 
        critical: false, 
        errorKey: `download-${item.id}` 
      });
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
    setError,
    
    // Error handling
    errorHandler
  };
};