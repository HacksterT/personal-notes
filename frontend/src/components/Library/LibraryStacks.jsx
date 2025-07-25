import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Grid3x3,
  List,
  Upload,
  Download,
  Filter,
  Clock,
  Star,
  Share2,
  Trash2,
  Edit3,
  Eye,
  Calendar,
  FileText,
  Tag,
  BookmarkPlus,
  X
} from 'lucide-react';

// Import our API service and navigation
import { apiService } from '../../services/api';
import TagBoxesPost from '../TagBoxesPost';

// Simple markdown renderer for sermon content
const MarkdownRenderer = ({ content }) => {
  const renderMarkdown = (text) => {
    let html = text;
    
    // Handle scripture references (custom formatting)
    html = html.replace(/\*Scripture: (.*?)\*/g, '<div class="scripture"><strong>Scripture:</strong> $1</div>');
    
    // Handle headings
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
    
    // Handle bold text
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Handle italic text
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Handle line breaks (convert double newlines to paragraphs)
    html = html.replace(/\n\n/g, '</p><p>');
    html = '<p>' + html + '</p>';
    
    // Clean up empty paragraphs
    html = html.replace(/<p><\/p>/g, '');
    html = html.replace(/<p>\s*<h/g, '<h');
    html = html.replace(/<\/h([123])>\s*<\/p>/g, '</h$1>');
    
    return html;
  };

  const styles = `
    h1 { font-size: 22px; font-weight: 600; margin: 16px 0 8px 0; color: #654321; }
    h2 { font-size: 19px; font-weight: 600; margin: 14px 0 6px 0; color: #654321; }
    h3 { font-size: 17px; font-weight: 600; margin: 12px 0 4px 0; color: #654321; }
    p { margin: 8px 0; line-height: 1.5; }
    strong { color: #654321; }
    em { font-style: italic; color: #8B4513; }
    .scripture {
      background: #f8f6f0;
      border-left: 3px solid #D4A574;
      padding: 8px 12px;
      margin: 8px 0;
      border-radius: 4px;
      font-style: italic;
    }
  `;

  return (
    <>
      <style>{styles}</style>
      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
    </>
  );
};
import TagBoxes from '../TagBoxes';
import NavigationMenu from './NavigationMenu';

const LibraryStacks = () => {
  const navigate = useNavigate();

  const [categories, setCategories] = useState({});
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [storageUsage, setStorageUsage] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('sermons');
  const [categoryContent, setCategoryContent] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [updatingTags, setUpdatingTags] = useState(new Set());
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'list'
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'recent', 'favorites', 'shared'
  const [sortMode, setSortMode] = useState('date'); // 'date', 'title', 'category' (removed 'tags')
  const [multiTagFilters, setMultiTagFilters] = useState([
    { tag: '', operator: 'AND' },
    { tag: '', operator: 'AND' },
    { tag: '', operator: 'AND' }
  ]);
  const [allContent, setAllContent] = useState([]); // All content across categories for list view
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Selected content for banner summary
  const [selectedContentForSummary, setSelectedContentForSummary] = useState(null);
  const [selectedContentId, setSelectedContentId] = useState(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiAnalysisFailed, setAiAnalysisFailed] = useState(false);
  
  // Content viewer modal
  const [showContentViewer, setShowContentViewer] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);

  // Load initial data
  useEffect(() => {
    loadLibraryData();
  }, []);

  // Load category content when selection changes
  useEffect(() => {
    if (selectedCategory && !searchQuery) {
      loadCategoryContent(selectedCategory);
    }
  }, [selectedCategory]);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery);
    } else {
      setSearchResults([]);
      if (selectedCategory) {
        loadCategoryContent(selectedCategory);
      }
    }
  }, [searchQuery]);

  // Load all content when switching to list view
  useEffect(() => {
    if (viewMode === 'list' && Object.keys(categories).length > 0) {
      loadAllContent();
    }
  }, [viewMode, categories]);

  // Add this useEffect to reset state on category changes
useEffect(() => {
  // Reset upload state when category changes
  setUploading(false);
  setUploadProgress([]);
  setError('');
  console.log(`📂 Category changed to: ${selectedCategory}, upload state reset`);
}, [selectedCategory]);

// Alternative fix: Force re-attach event listeners after each upload
useEffect(() => {
  if (!uploading) {
    // Re-attach event listeners after upload completes
    const timer = setTimeout(() => {
      console.log('🔗 Re-initializing drag & drop handlers');
      // Force a small re-render to refresh event handlers
      setError(''); // This triggers a re-render without changing visible state
    }, 50);
    
    return () => clearTimeout(timer);
  }
}, [uploading]);

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

  // New function to refresh just the category counts without affecting scroll
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

  const loadCategoryContent = async (categoryKey) => {
    try {
      const response = await apiService.listContent(categoryKey, 50, 0);
      const content = response.items || [];
      setCategoryContent(content);
      
      // Update category count
      setCategories(prev => ({
        ...prev,
        [categoryKey]: {
          ...prev[categoryKey],
          count: content.length
        }
      }));
    } catch (err) {
      console.error(`Failed to load ${categoryKey} content:`, err);
      setCategoryContent([]);
    }
  };

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

  const openStack = (categoryKey) => {
    setSelectedCategory(categoryKey);
    setSearchQuery(''); // Clear search when selecting category
  };

  // New function to handle artifact selection for summary
  const handleArtifactSelect = async (item) => {
    try {
      console.log(`📋 Loading themes for: ${item.title}`);
      setSelectedContentId(item.id); // Track selected item
      setAiAnalysisFailed(false); // Reset failure state
      const fullContent = await apiService.getContent(item.id);
      setSelectedContentForSummary(fullContent);
      
      // Check if AI analysis failed
      if (fullContent.processing_status === 'failed') {
        console.log('❌ AI analysis previously failed for:', item.title);
        setAiAnalysisLoading(false);
        setAiAnalysisFailed(true);
        return;
      }
      
      // Check if AI analysis is still in progress
      if (!fullContent.key_themes || fullContent.key_themes.length === 0) {
        console.log('🤖 AI analysis in progress, showing loading state...');
        setAiAnalysisLoading(true);
        setAiAnalysisFailed(false);
        
        // Poll for updates every 3 seconds if analysis is pending (with 6.67-minute timeout)
        const pollForAnalysis = async (startTime = Date.now()) => {
          // Check if 6.67 minutes have passed (400,000 ms)
          const elapsed = Date.now() - startTime;
          if (elapsed > 400000) {
            console.log('⏰ AI analysis polling timeout after 6.67 minutes');
            setAiAnalysisLoading(false);
            setAiAnalysisFailed(true);
            return;
          }
          
          try {
            const updatedContent = await apiService.getContent(item.id);
            if (updatedContent.processing_status === 'completed' && updatedContent.key_themes && updatedContent.key_themes.length > 0) {
              console.log('✅ AI analysis completed:', updatedContent.key_themes);
              setSelectedContentForSummary(updatedContent);
              setAiAnalysisLoading(false);
              setAiAnalysisFailed(false);
            } else if (updatedContent.processing_status === 'failed') {
              console.log('❌ AI analysis failed during polling');
              setAiAnalysisLoading(false);
              setAiAnalysisFailed(true);
            } else if (updatedContent.processing_status === 'pending') {
              // Continue polling while still pending
              setTimeout(() => pollForAnalysis(startTime), 3000);
            } else {
              // Unknown status - stop polling
              console.log('🔍 Unknown processing status:', updatedContent.processing_status);
              setAiAnalysisLoading(false);
            }
          } catch (pollErr) {
            console.error('Polling error:', pollErr);
            setAiAnalysisLoading(false);
            setAiAnalysisFailed(true);
            // Stop polling if content not found (404) or other errors
            return;
          }
        };
        
        // Start polling after 2 seconds
        setTimeout(pollForAnalysis, 2000);
      } else {
        console.log('✅ Themes already available:', fullContent.processing_status);
        setAiAnalysisLoading(false);
        setAiAnalysisFailed(false);
      }
    } catch (err) {
      console.error('❌ Failed to load summary:', err);
      setSelectedContentForSummary(null);
      setSelectedContentId(null);
      setAiAnalysisLoading(false);
      setAiAnalysisFailed(false);
    }
  };

  // Handle tag changes with API call (now handles both regular tags and post_tags)

  const handleTagsChange = async (contentId, newTags, newPostTags = null) => {
    setUpdatingTags(prev => new Set(prev).add(contentId));
    
    try {
      console.log(`Updating tags for ${contentId}:`, newTags, 'Post tags:', newPostTags);
      
      // Find current item to get existing post_tags if not provided
      const currentItem = categoryContent.find(item => item.id === contentId) || 
                         allContent.find(item => item.id === contentId);
      
      const postTagsToSave = newPostTags !== null ? newPostTags : (currentItem?.post_tags || []);
      
      // Save both regular tags and post_tags
      const promises = [apiService.updateContentTags(contentId, newTags)];
      
      // Only update post_tags if this is a social-media-posts item
      if (currentItem?.category === 'social-media-posts') {
        promises.push(apiService.updateContentPostTags(contentId, postTagsToSave));
      }
      
      await Promise.all(promises);
      
      // Update local state for both category and all content
      const updateFunction = (item) => 
        item.id === contentId 
          ? { ...item, tags: newTags, post_tags: postTagsToSave }
          : item;
      
      setCategoryContent(prevContent => prevContent.map(updateFunction));
      setAllContent(prevContent => prevContent.map(updateFunction));
      
      console.log('Tags and post_tags updated successfully');
      
    } catch (error) {
      console.error('Failed to update tags:', error);
      throw error; // Re-throw so TagBoxes can handle the error
    } finally {
      setUpdatingTags(prev => {
        const newSet = new Set(prev);
        newSet.delete(contentId);
        return newSet;
      });
    }
  };


  const handleContentAction = async (action, item) => {
    console.log(`${action} action on:`, item.title);
    
    switch (action) {
      case 'view':
        // Load full content and open viewer
        try {
          const fullContent = await apiService.getContent(item.id);
          setSelectedContent(fullContent);
          setShowContentViewer(true);
          // Also load for summary box
          setSelectedContentForSummary(fullContent);
        } catch (err) {
          console.error('Failed to load content:', err);
          setError('Failed to load content for viewing.');
        }
        break;
      case 'edit':
        console.log('✏️ Editing:', item.title);
        
        if (item.category === 'sermons') {
          // Handle sermon editing - redirect to Sermon Generator
          if (window.confirm('You have chosen to go to the Sermon Generator for edits. Are you sure?')) {
            try {
              // Get the full content
              const fullContent = await apiService.getContent(item.id);
              
              // Store the content in localStorage for the Sermon Generator
              localStorage.setItem('editingSermon', JSON.stringify({
                id: fullContent.id,
                title: fullContent.title,
                content: fullContent.content,
                category: fullContent.category,
                filename: fullContent.filename
              }));
              
              // Navigate to sermon generator
              navigate('/workshop');
            } catch (err) {
              console.error('Failed to load sermon for editing:', err);
              alert('Failed to load sermon content. Please try again.');
            }
          }
          return;
        }
        
        // Only allow editing of Study Notes and Journal items
        if (item.category !== 'study-notes' && item.category !== 'journal') {
          alert('Only Study Notes, Journal entries, and Sermons can be edited.');
          return;
        }
        
        // Show confirmation dialog
        if (window.confirm('You have chosen to go to the Study Hall for edits. Are you sure?')) {
          try {
            // Get the full content
            const fullContent = await apiService.getContent(item.id);
            
            // Store the content in localStorage for the Study Hall editor
            localStorage.setItem('editingContent', JSON.stringify({
              id: fullContent.id,
              title: fullContent.title,
              content: fullContent.content,
              category: fullContent.category,
              filename: fullContent.filename
            }));
            
            // Navigate to Study Hall
            navigate('/study');
          } catch (err) {
            console.error('Failed to load content for editing:', err);
            alert('Failed to load content for editing. Please try again.');
          }
        }
        break;
      case 'delete':
        if (window.confirm(`Delete "${item.title}"?`)) {
          try {
            await apiService.deleteContent(item.id);
            await loadCategoryContent(selectedCategory);
            await loadLibraryData(true); // Refresh usage stats without changing category content
          } catch (err) {
            console.error('Delete failed:', err);
          }
        }
        break;
      case 'addToActive':
        console.log('📋 Adding to Active Resources:', item.title);
        
        // Confirm the action with combined message
        const confirmAdd = confirm(`Add "${item.title}" to Active Resources?\n\nThis will make it available for sermon curation in Study Hall.\n\nClick OK to add it to your active resources.`);
        if (!confirmAdd) {
          return; // User cancelled
        }
        
        try {
          // Get current active resources from localStorage
          const existingResources = JSON.parse(localStorage.getItem('activeResources') || '[]');
          
          // Check if already exists
          if (existingResources.find(r => r.id === item.id)) {
            alert(`"${item.title}" is already in Active Resources.`);
            return;
          }
          
          // Check if we have space (max 5)
          if (existingResources.length >= 5) {
            alert('Active Resources is full (5/5). Remove a resource first or go to Study Hall to manage.');
            return;
          }
          
          // Format the item for active resources
          const resourceItem = {
            id: item.id,
            title: item.title,
            category: item.category,
            type: item.category,
            size: formatFileSize(item.size_bytes || 0),
            content: item.content || '',
            key_themes: item.key_themes || [], // Include themes for sermon curation
            tags: item.tags || [], // Include tags for resource viewer
            date_created: item.date_created,
            date_modified: item.date_modified
          };
          
          // Add to active resources
          const updatedResources = [...existingResources, resourceItem];
          localStorage.setItem('activeResources', JSON.stringify(updatedResources));
          
          // Remove the second popup - success will be shown via console log only
          console.log(`✅ "${item.title}" added to Active Resources (${updatedResources.length}/5)`);
          
        } catch (error) {
          console.error('Failed to add to active resources:', error);
          alert('Failed to add to Active Resources. Please try again.');
        }
        break;
      case 'export':
        console.log('📤 Exporting:', item.title);
        break;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

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

  const getAllAvailableTags = () => {
    const content = searchQuery.trim() ? searchResults : categoryContent;
    const allTags = new Set();
    content.forEach(item => {
      if (item.tags) {
        item.tags.forEach(tag => allTags.add(tag));
      }
    });
    return Array.from(allTags).sort();
  };

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

  const loadAllContent = async () => {
    try {
      console.log('🔄 Loading all content across categories for list view...');
      const allItems = [];
      
      // Load content from all categories
      for (const categoryKey of Object.keys(categories)) {
        try {
          const response = await apiService.listContent(categoryKey, 50, 0);
          const content = response.items || [];
          allItems.push(...content);
        } catch (err) {
          console.error(`Failed to load ${categoryKey} content:`, err);
        }
      }
      
      setAllContent(allItems);
      console.log(`✅ Loaded ${allItems.length} items across all categories`);
    } catch (err) {
      console.error('❌ Failed to load all content:', err);
    }
  };

  const getDisplayContent = () => {
    let content;
    
    if (searchQuery.trim()) {
      content = searchResults;
    } else if (viewMode === 'list') {
      // List view shows all content across categories
      content = allContent;
    } else {
      // Card view shows selected category content
      content = categoryContent;
    }
    
    content = filterContentByMultiTags(content, multiTagFilters);
    return sortContent(content, sortMode);
  };
  
  const handleFileUpload = async (files, category = selectedCategory) => {
    // Prevent multiple simultaneous uploads
    if (uploading) {
      console.log('Upload already in progress, ignoring...');
      return;
    }
    setUploading(true);
    setUploadProgress([]);
    
    try {
      console.log(`📤 Uploading ${files.length} files to ${category}...`);
      
      // Upload files using API service
      const result = await apiService.uploadFiles(files, category);
      
      console.log(`✅ Upload complete: ${result.uploaded_count} files uploaded`);
      
      // Update the selected category to match where files were uploaded
      setSelectedCategory(category);
      
      // Refresh only the category counts without affecting scroll position
      await refreshCategoryCounts();
      await loadCategoryContent(category);
      
      setShowUploadModal(false);
    } catch (error) {
      console.error('Upload failed:', error);
      setError('Upload failed. Please try again.');
    } finally {
      // CRITICAL FIX: Always reset uploading state
      setUploading(false);
      
      // Force re-render of drag handlers
      setTimeout(() => {
        console.log('🔄 Upload state reset, ready for next upload');
      }, 100);
    }
  };
  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();

    console.log('🎯 Drop event triggered!', {
      uploading,
      fileCount: event.dataTransfer.files.length,
      timestamp: new Date().toISOString()
    });

    // Extra safety check
    if (uploading) {
      console.log('❌ Upload blocked - already uploading');
      return;
    }

    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      console.log(`📂 Processing ${files.length} dropped files`);
      handleFileUpload(files);
    } else {
      console.log('❌ No files detected in drop');
    }
  }

  const handleDownload = async (item) => {
    try {
      // Create file content
      let content = item.content || '';
      let filename = item.filename || `${item.title}.md`;
      let mimeType = 'text/markdown';
      
      // If it's markdown content, format it nicely
      if (!content.startsWith('#')) {
        content = `# ${item.title}\n\n`;
        if (item.passage) content += `**Passage:** ${item.passage}\n\n`;
        if (item.tags && item.tags.length) content += `**Tags:** ${item.tags.join(', ')}\n\n`;
        content += item.content || '';
      }
      
      // Create and download file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log(`📥 Downloaded: ${filename}`);
    } catch (error) {
      console.error('Download failed:', error);
      setError('Download failed. Please try again.');
    }
  };

  const handleBulkExport = async () => {
    try {
      const blob = await apiService.exportData();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `sermon_organizer_export_${selectedCategory}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      console.log(`📦 Exported ${selectedCategory}`);
    } catch (error) {
      console.error('Export failed:', error);
      setError('Export failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-library-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-brass text-4xl mb-4">🗃️</div>
          <p className="text-brass text-lg">Loading your library stacks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-library-gradient">
      {/* Header */}
      <div className="bg-library-dark/90 border-b-2 border-brass px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <NavigationMenu />
          
          <div className="h-6 w-px bg-brass/30" />
          
          <h1 className="text-2xl font-cormorant text-brass">
            🗃️ Library Stacks - Content Storage & Retrieval
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Storage Usage */}
          <div className="text-brass-light text-sm">
            <span className="font-medium">{(storageUsage.total_bytes / (1024**3)).toFixed(2) || 0} GB</span> / 5 GB
            <div className="w-32 h-2 bg-library-dark/50 rounded-full mt-1 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-green-500 to-yellow-500 transition-all duration-500"
                style={{ width: `${Math.min(100, storageUsage.formatted?.percentage_used || 0)}%` }}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="file"
              id="file-upload"
              multiple
              accept=".txt,.md,.docx,.pdf"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button 
              onClick={() => document.getElementById('file-upload').click()}
              disabled={uploading}
              className="p-2 rounded-lg bg-brass/10 text-brass-light hover:bg-brass/20 transition-colors duration-300 disabled:opacity-50"
              title="Upload Files"
            >
              {uploading ? (
                <div className="animate-spin">⏳</div>
              ) : (
                <Upload size={20} />
              )}
            </button>
            
            <button 
              onClick={handleBulkExport}
              className="p-2 rounded-lg bg-brass/10 text-brass-light hover:bg-brass/20 transition-colors duration-300"
              title="Export Category"
            >
              <Download size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-12 h-[calc(100vh-80px)]">
        
        {/* Library Stacks - Left Side */}
        <div className="col-span-3 bg-library-brown/20 border-r border-brass/30 overflow-y-auto library-scrollbar">
          {/* Search */}
          <div className="p-4 border-b border-brass/20">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brass-light" size={18} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search your library..."
                className="library-input w-full pl-10"
              />
            </div>
          </div>

          {/* Filter Options */}
          <div className="p-4 border-b border-brass/20">
            <div className="flex gap-2 flex-wrap">
              {[
                { key: 'all', label: 'All Content', icon: '📂' },
                { key: 'recent', label: 'Recent', icon: '🕒' },
                { key: 'favorites', label: 'Favorites', icon: '⭐' },
                { key: 'shared', label: 'Shared', icon: '🔗' }
              ].map((filter) => (
                <button
                  key={filter.key}
                  onClick={() => setFilterMode(filter.key)}
                  className={`px-3 py-1 rounded-full text-xs transition-colors duration-300 ${
                    filterMode === filter.key
                      ? 'bg-brass/30 text-cream'
                      : 'bg-brass/10 text-brass-light hover:bg-brass/20'
                  }`}
                >
                  {filter.icon} {filter.label}
                </button>
              ))}
            </div>
          </div>

          {/* Library Stacks */}
          <div className="p-4 space-y-3">
            {Object.entries(categories).map(([categoryKey, category]) => (
              <div
              key={categoryKey}
              className={`library-item cursor-pointer transition-colors duration-300 relative group ${
                selectedCategory === categoryKey 
                  ? 'ring-2 ring-brass bg-orange-700/60 border-yellow-500' 
                  : 'bg-orange-800/30 hover:bg-orange-800/40'
              }`}
              onClick={() => openStack(categoryKey)}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const files = Array.from(e.dataTransfer.files);
                if (files.length > 0) {
                  handleFileUpload(files, categoryKey);
                }
              }}
            >
                <div className="text-center p-4">
                  <div className="text-3xl mb-2">{category.icon}</div>
                  <div className="font-cormorant font-semibold text-cream text-lg mb-1">
                    {category.name}
                  </div>
                  <div className="text-brass-light text-sm">
                    {category.count} items
                  </div>
                  <div className="text-brass-light text-xs opacity-75">
                    {formatFileSize(category.totalSizeBytes)}
                  </div>
                </div>
                {/* Drop Zone Indicator */}
                <div className="absolute bottom-2 right-2 bg-brass/20 rounded-full p-1">
                  <Upload size={12} className="text-brass" />
                </div>
                
                {/* Visual drop zone hint */}
                <div className="absolute inset-0 border-2 border-dashed border-transparent group-hover:border-brass/40 rounded-lg transition-all duration-300 pointer-events-none">
                  <div className="absolute top-2 left-2 text-xs text-brass/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Drop files here
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content Display - Right Side */}
        <div className="col-span-9 bg-cream/95 overflow-y-auto library-scrollbar">
          {/* Content Header */}
                    <div className="sticky top-0 z-10 bg-cream/95 border-b border-brass/30 p-6 backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row lg:items-center w-full gap-4">
              {/* Key Themes Box - Fixed width, always on the left */}
              <div className="flex-shrink-0" style={{ width: '473px' }}>
                <div className="bg-white border-2 border-amber-800 rounded-lg p-3 lg:p-4 shadow-sm flex flex-col h-32 lg:h-40">
                  <div className="text-wood-dark font-semibold text-xs lg:text-sm mb-2 text-left border-b border-amber-200 pb-1">
                    Key Themes
                  </div>
                  <div className="text-wood-dark text-xs lg:text-sm leading-relaxed overflow-y-auto flex-1 text-left">
                    {aiAnalysisLoading ? (
                      <div className="flex flex-col items-start gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-amber-600 border-t-transparent rounded-full"></div>
                        <div className="text-amber-700 text-xs">
                          The Librarian is fetching key themes... one moment
                        </div>
                      </div>
                    ) : aiAnalysisFailed ? (
                      <div className="flex flex-col gap-2 text-left">
                        <div className="text-red-600 text-xs">
                          ⚠️ AI analysis failed after multiple attempts
                        </div>
                        <div className="text-red-500 text-xs leading-relaxed">
                          Edit and save this document in Study Hall to retry the analysis, or re-upload the file to try again.
                        </div>
                      </div>
                    ) : selectedContentForSummary?.key_themes?.length > 0 ? (
                        <div className="space-y-1">
                          {selectedContentForSummary.key_themes.map((theme, index) => (
                            <div key={index} className="text-left">
                              • {theme}
                            </div>
                          ))}
                        </div>
                      ) : "Upon selecting an artifact, the Librarian will provide key themes from AI analysis."
                    }
                  </div>
                </div>
              </div>

              {/* Category Title and Count - Moved to middle for grid view */}
              {viewMode === 'cards' && (
                <div className="flex-grow flex items-center justify-center">
                  <div className="text-center">
                    <h2 className="text-xl lg:text-2xl font-cormorant text-library-dark">
                      {searchQuery.trim() 
                        ? `Search Results for "${searchQuery}"` 
                        : categories[selectedCategory]?.name || 'Content'
                      }
                    </h2>
                    <p className="text-wood-dark text-sm mt-1">
                      {getDisplayContent().length} item{getDisplayContent().length !== 1 ? 's' : ''} found
                    </p>
                  </div>
                </div>
              )}
              
              {/* Right side controls container - Sort, Multi-Tag Filter and View Controls */}
              <div className="flex items-start gap-6 flex-shrink-0 ml-auto">
                
                {/* Sort and Multi-Tag Filter stacked column */}
                <div className="flex flex-col">
                  {/* Sort controls - above Filter Tags */}
                  <div className="flex items-center gap-1 -mt-2 mb-1">
                    <span className="text-xs text-wood-dark/60">Sort:</span>
                    <select
                      value={sortMode}
                      onChange={(e) => setSortMode(e.target.value)}
                      className="text-xs bg-white border border-brass/30 rounded px-2 py-1 text-wood-dark focus:outline-none focus:border-brass"
                    >
                      <option value="date">Date</option>
                      <option value="title">Title</option>
                      <option value="category">Category</option>
                    </select>
                  </div>
                  
                  {/* Separator line */}
                  <div className="border-t border-brass/50 mb-2"></div>
                  
                  {/* Multi-Tag Filter - 3 row stacked column */}
                  <div className="flex flex-col gap-1">
                  {/* Header row */}
                  <div className="flex items-center gap-2 text-xs text-wood-dark/60">
                    <span className="w-24">Filter Tags:</span>
                    <span className="w-12 text-center">AND</span>
                    <span className="w-12 text-center">OR</span>
                  </div>
                  
                  {/* 3 filter rows */}
                  {multiTagFilters.map((filter, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <select
                        value={filter.tag}
                        onChange={(e) => handleMultiTagChange(index, e.target.value)}
                        className="text-xs bg-white border border-brass/30 rounded px-2 py-1 text-wood-dark focus:outline-none focus:border-brass w-24"
                      >
                        <option value="">-- Select --</option>
                        {getAllAvailableTags().map(tag => (
                          <option key={tag} value={tag}>{tag}</option>
                        ))}
                      </select>
                      
                      {/* AND radio button */}
                      <div className="w-12 flex justify-center">
                        <input
                          type="radio"
                          name={`operator-${index}`}
                          value="AND"
                          checked={filter.operator === 'AND'}
                          onChange={(e) => handleMultiTagOperatorChange(index, e.target.value)}
                          className="text-xs"
                          disabled={!filter.tag}
                        />
                      </div>
                      
                      {/* OR radio button */}
                      <div className="w-12 flex justify-center">
                        <input
                          type="radio"
                          name={`operator-${index}`}
                          value="OR"
                          checked={filter.operator === 'OR'}
                          onChange={(e) => handleMultiTagOperatorChange(index, e.target.value)}
                          className="text-xs"
                          disabled={!filter.tag}
                        />
                      </div>
                    </div>
                  ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                
                {/* View mode buttons */}
                <button
                  onClick={() => setViewMode('cards')}
                  className={`p-2 rounded ${viewMode === 'cards' ? 'bg-brass/20 text-wood-dark' : 'text-wood-dark/60 hover:bg-brass/10'}`}
                >
                  <Grid3x3 size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-brass/20 text-wood-dark' : 'text-wood-dark/60 hover:bg-brass/10'}`}
                >
                  <List size={18} />
                </button>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-6">
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
                {error}
              </div>
            </div>
          )}

          {/* Content Grid/List */}
          <div 
            className="p-6 min-h-96 relative"
            onDragOver={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🎯 INLINE Drop triggered!', {
                uploading,
                fileCount: e.dataTransfer.files.length
              });
    
              if (!uploading) {
                const files = Array.from(e.dataTransfer.files);
                if (files.length > 0) {
                  handleFileUpload(files);
                }
              }
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Show guidance overlay
              const overlay = document.getElementById('drag-guidance-overlay');
              if (overlay) overlay.style.display = 'flex';
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.stopPropagation();
              // Hide guidance overlay if leaving the main area
              if (!e.relatedTarget || !e.currentTarget.contains(e.relatedTarget)) {
                const overlay = document.getElementById('drag-guidance-overlay');
                if (overlay) overlay.style.display = 'none';
              }
            }}
          >
            {/* Drag Guidance Overlay */}
            <div 
              id="drag-guidance-overlay"
              className="absolute inset-0 bg-amber-100/90 border-2 border-dashed border-amber-300 rounded-lg hidden items-center justify-center z-10"
              style={{ display: 'none' }}
            >
              <div className="text-center p-8">
                <div className="text-6xl mb-4">👈</div>
                <h3 className="text-2xl font-bold text-amber-800 mb-2">Drop files on a folder card!</h3>
                <p className="text-amber-700 text-lg">
                  Drag your files to one of the category folders on the left column
                </p>
                <p className="text-amber-600 text-sm mt-2">
                  (Sermons, Study Notes, Research, or Journal)
                </p>
              </div>
            </div>
            {getDisplayContent().length === 0 && !error ? (
              <div className="text-center py-16">
                {searchQuery.trim() ? (
                  // Search results empty state
                  <>
                    <div className="text-6xl mb-6 opacity-60">🔍</div>
                    <h3 className="text-2xl font-cormorant text-wood-dark mb-3">
                      No results found
                    </h3>
                    <p className="text-wood-dark/70 text-lg max-w-md mx-auto">
                      Try adjusting your search term or browse the categories to explore your content.
                    </p>
                  </>
                ) : (
                  // Empty category state with upload instructions
                  <>
                    <div className="text-7xl mb-6 opacity-80">📚</div>
                    <h3 className="text-2xl font-cormorant text-wood-dark mb-4">
                      Your {categories[selectedCategory]?.name || 'Library'} collection awaits
                    </h3>
                    <div className="max-w-lg mx-auto space-y-4">
                      <p className="text-wood-dark/80 text-lg leading-relaxed mb-4">
                        Start building your theological library by adding content to your collections.
                      </p>
                      
                      {/* Clear Upload Instructions with Visual Guide */}
                      <div className="bg-amber-50 border-2 border-amber-200 rounded-lg p-4 mb-4">
                        <h4 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                          <span className="text-xl">📋</span>
                          How to Upload Files
                        </h4>
                        <div className="space-y-3 text-sm text-amber-700">
                          <div className="flex items-start gap-3">
                            <span className="bg-amber-200 text-amber-800 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">1</span>
                            <div>
                              <strong>Select a category folder</strong> from the left column (Sermons, Study Notes, etc.)
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="bg-amber-200 text-amber-800 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">2</span>
                            <div>
                              <strong>Drag your files directly onto the folder card</strong> on the left
                              <div className="text-xs text-amber-600 mt-1">💡 Don't drop files in this main area - use the folder cards!</div>
                            </div>
                          </div>
                          <div className="flex items-start gap-3">
                            <span className="bg-amber-200 text-amber-800 rounded-full w-6 h-6 flex items-center justify-center font-bold text-xs">3</span>
                            <div>
                              Files will be automatically organized in your selected category
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-center gap-2 text-brass/60 text-sm">
                        <span className="text-lg">📎</span>
                        <span>Supports .txt, .md, .docx, and .pdf files</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className={viewMode === 'cards' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                : 'space-y-3'
              }>
                {getDisplayContent().map((item) => (
                  <div
                    key={item.id}
                    className={viewMode === 'cards' 
                      ? `content-card group cursor-pointer ${selectedContentId === item.id ? 'border-2 border-amber-800' : ''}`
                      : `flex items-center p-4 bg-white rounded-lg hover:shadow-md transition-all duration-300 cursor-pointer ${selectedContentId === item.id ? 'border-2 border-amber-800' : 'border border-brass/20'}`
                    }
                    onClick={() => handleArtifactSelect(item)}
                  >
                    {viewMode === 'cards' ? (
                      // Card View
                      <>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs bg-brass/20 text-wood-dark px-2 py-1 rounded-full">
                              {item.category || 'content'}
                            </span>
                            {/* post_tags for social-media-posts only */}
                            {item.category === 'social-media-posts' && (
                              <TagBoxesPost 
                                postTags={item.post_tags}
                                contentId={item.id}
                                onPostTagsChange={(contentId, newPostTags) => {
                                  // Update local state immediately
                                  const updateItem = (item) => item.id === contentId ? { ...item, post_tags: newPostTags } : item;
                                  setAllContent(prevItems => prevItems.map(updateItem));
                                  setCategoryContent(prevItems => prevItems.map(updateItem));
                                }}
                              />
                            )}
                            {item.status === 'draft' && (
                              <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                                Draft
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-wood-dark/60">
                            {formatDate(item.date_modified || item.date_created)}
                          </div>
                        </div>

                        <h3 className="font-cormorant font-semibold text-library-dark text-lg mb-2 group-hover:text-wood-dark transition-colors">
                          {item.title}
                        </h3>

                        {item.passage && (
                          <p className="text-wood-dark text-sm mb-2 italic">
                            {item.passage}
                          </p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-wood-dark/60 mb-3">
                          {item.word_count && (
                            <span className="flex items-center gap-1">
                              <FileText size={12} />
                              {item.word_count} words
                            </span>
                          )}
                          {item.size_bytes && (
                            <span>{formatFileSize(item.size_bytes)}</span>
                          )}
                        </div>

                        {/* Replaced with TagBoxes component */}
                        <div className="mb-3">
                          <TagBoxes 
                            tags={item.tags} 
                            category={item.category}
                            compact={false} 
                            contentId={item.id}
                            onTagsChange={handleTagsChange}
                          />
                        </div>

                        <div className="flex items-center justify-between pt-3 border-t border-brass/20">
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleContentAction('view', item)}
                              className="p-1 text-wood-dark/60 hover:text-wood-dark hover:bg-brass/10 rounded transition-all duration-200"
                              title="View"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => handleContentAction('edit', item)}
                              className="p-1 text-wood-dark/60 hover:text-wood-dark hover:bg-brass/10 rounded transition-all duration-200"
                              title="Edit"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDownload(item)}
                              className="p-1 text-wood-dark/60 hover:text-wood-dark hover:bg-brass/10 rounded transition-all duration-200"
                              title="Download"
                            >
                              <Download size={14} />
                            </button>
                            <button
                              onClick={() => handleContentAction('addToActive', item)}
                              className="p-1 text-brass/70 hover:text-brass hover:bg-brass/10 rounded transition-all duration-200"
                              title="Add to Active Resources"
                            >
                              <BookmarkPlus size={14} />
                            </button>
                          </div>
                          <button
                            onClick={() => handleContentAction('delete', item)}
                            className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all duration-200"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </>
                    ) : (
                      // List View
                      <>
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="font-cormorant font-semibold text-library-dark">
                              {item.title}
                            </h3>
                            {item.passage && (
                              <span className="text-wood-dark text-sm italic">
                                {item.passage}
                              </span>
                            )}
                            {item.category && (
                              <span className="text-xs bg-brass/20 text-wood-dark px-2 py-1 rounded-full">
                                {item.category.charAt(0).toUpperCase() + item.category.slice(1).replace('-', ' ')}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-wood-dark/60 mt-1">
                            <span>{formatDate(item.date_modified || item.date_created)}</span>
                            {item.word_count && <span>{item.word_count} words</span>}
                            <span>{formatFileSize(item.size_bytes || 0)}</span>
                            {/* Replaced with compact TagBoxes */}
                            <TagBoxes 
                              tags={item.tags} 
                              category={item.category}
                              compact={true}
                              contentId={item.id}
                              onTagsChange={handleTagsChange}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleContentAction('view', item)}
                            className="p-2 text-wood-dark/60 hover:text-wood-dark hover:bg-brass/10 rounded transition-all duration-200"
                            title="View"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={() => handleContentAction('edit', item)}
                            className="p-2 text-wood-dark/60 hover:text-wood-dark hover:bg-brass/10 rounded transition-all duration-200"
                            title="Edit"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() => handleDownload(item)}
                            className="p-2 text-wood-dark/60 hover:text-wood-dark hover:bg-brass/10 rounded transition-all duration-200"
                            title="Download"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => handleContentAction('addToActive', item)}
                            className="p-2 text-brass/70 hover:text-brass hover:bg-brass/10 rounded transition-all duration-200"
                            title="Add to Active Resources"
                          >
                            <BookmarkPlus size={16} />
                          </button>
                          <button
                            onClick={() => handleContentAction('delete', item)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-all duration-200"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content Viewer Modal */}
      {showContentViewer && selectedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] w-full flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-wood-dark truncate">
                {selectedContent.title}
              </h2>
              <button
                onClick={() => setShowContentViewer(false)}
                className="p-1 hover:bg-gray-100 rounded text-gray-600 hover:text-gray-800"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {selectedContent.category === 'sermons' ? (
                <div className="text-sm text-gray-800 leading-relaxed">
                  <MarkdownRenderer content={selectedContent.content} />
                </div>
              ) : (
                <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                  {selectedContent.content}
                </div>
              )}
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default LibraryStacks;