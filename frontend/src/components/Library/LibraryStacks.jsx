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
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'list'
  const [filterMode, setFilterMode] = useState('all'); // 'all', 'recent', 'favorites', 'shared'
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
        journal: { name: 'Journal', icon: '📔', count: 0, totalSizeBytes: 0 }
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
        // Only allow editing of Study Notes and Journal items
        if (item.category !== 'study-notes' && item.category !== 'journal') {
          alert('Only Study Notes and Journal entries can be edited.');
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

  const getDisplayContent = () => {
    return searchQuery.trim() ? searchResults : categoryContent;
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

const debugUploadState = () => {
  console.log('🐛 Upload Debug State:', {
    uploading,
    selectedCategory,
    hasEventListeners: !!document.querySelector('[onDrop]'),
    timestamp: new Date().toISOString()
  });
};
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
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between w-full gap-4">
              <div className="flex-shrink-0">
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

              {/* Summary Review Box */}
              <div className="flex-1 lg:mx-8">
                <div className="bg-white border-2 border-amber-800 rounded-lg p-3 lg:p-4 shadow-sm flex flex-col h-32 lg:h-40">
                  <div className="text-wood-dark font-semibold text-xs lg:text-sm mb-2 text-center border-b border-amber-200 pb-1">
                    Key Themes
                  </div>
                  <div className="text-wood-dark text-xs lg:text-sm leading-relaxed overflow-y-auto flex-1 flex items-center justify-center text-center">
                    {aiAnalysisLoading ? (
                      <div className="flex flex-col items-center gap-2">
                        <div className="animate-spin h-4 w-4 border-2 border-amber-600 border-t-transparent rounded-full"></div>
                        <div className="text-amber-700 text-xs">
                          The Librarian is fetching key themes... one moment
                        </div>
                      </div>
                    ) : aiAnalysisFailed ? (
                      <div className="flex flex-col items-center gap-2 text-center">
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
                            <div key={index} className="text-center">
                              • {theme}
                            </div>
                          ))}
                        </div>
                      ) : "Upon selecting an artifact, the Librarian will provide key themes from AI analysis."
                    }
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0 lg:justify-end">
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
                {getDisplayContent().map((item, index) => (
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

                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {item.tags.slice(0, 3).map((tag, tagIndex) => (
                              <span key={tagIndex} className="text-xs bg-brass/10 text-wood-dark px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                            {item.tags.length > 3 && (
                              <span className="text-xs text-wood-dark/60">
                                +{item.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}

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
                          </div>
                          <div className="flex items-center gap-4 text-xs text-wood-dark/60 mt-1">
                            <span>{formatDate(item.date_modified || item.date_created)}</span>
                            {item.word_count && <span>{item.word_count} words</span>}
                            <span>{formatFileSize(item.size_bytes || 0)}</span>
                            {item.tags && item.tags.length > 0 && (
                              <div className="flex items-center gap-1">
                                {item.tags.slice(0, 2).map((tag, tagIndex) => (
                                  <span key={tagIndex} className="text-xs bg-brass/10 text-wood-dark px-2 py-1 rounded">
                                    {tag}
                                  </span>
                                ))}
                                {item.tags.length > 2 && (
                                  <span className="text-xs text-wood-dark/60">
                                    +{item.tags.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
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
              <div className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                {selectedContent.content}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default LibraryStacks;