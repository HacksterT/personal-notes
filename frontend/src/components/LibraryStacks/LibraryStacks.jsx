import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';

// Import hooks
import { useContentManagement } from './hooks/useContentManagement';
import { useSearchAndFilter } from './hooks/useSearchAndFilter';
import { useFileUpload } from './hooks/useFileUpload';

// Import components
import ContentGrid from './components/ContentGrid';
import ContentViewer from './components/ContentViewer';
import UploadModal from './components/UploadModal';
import FilterControls from './components/FilterControls';
import SearchBar from './components/SearchBar';

// Import shared components
import NavigationMenu from '../Library/NavigationMenu';

const LibraryStacks = () => {
  const navigate = useNavigate();

  // Use custom hooks
  const contentHook = useContentManagement();
  const searchHook = useSearchAndFilter();
  const uploadHook = useFileUpload();

  // Local state for AI analysis
  const [selectedContentForSummary, setSelectedContentForSummary] = useState(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiAnalysisFailed, setAiAnalysisFailed] = useState(false);

  // Handle category change
  const handleCategoryChange = async (categoryKey) => {
    await contentHook.handleCategoryChange(categoryKey);
    searchHook.setSearchQuery(''); // Clear search when selecting category
  };

  // Handle content actions with navigation
  const handleContentAction = async (action, item) => {
    if (action === 'edit') {
      // Store content in localStorage for StudyHall
      localStorage.setItem('editingContent', JSON.stringify({
        id: item.id,
        title: item.title,
        content: item.content,
        category: item.category
      }));
      
      // Navigate to StudyHall
      navigate('/study-hall');
      return;
    }

    if (action === 'summary') {
      setSelectedContentForSummary(item);
      setAiAnalysisLoading(true);
      setAiAnalysisFailed(false);
      
      try {
        await contentHook.handleArtifactSelect(item);
      } catch (error) {
        setAiAnalysisFailed(true);
      } finally {
        setAiAnalysisLoading(false);
      }
      return;
    }

    // Handle other actions through content hook
    await contentHook.handleContentAction(action, item);
  };

  // Handle file upload success
  const handleUploadSuccess = async (category) => {
    await contentHook.refreshCategoryCounts();
    await contentHook.loadCategoryContent(category);
  };

  // Prepare content for display
  const getDisplayContent = () => {
    const baseContent = searchHook.searchQuery.trim() 
      ? searchHook.searchResults 
      : searchHook.viewMode === 'list' 
        ? contentHook.allContent 
        : contentHook.categoryContent;

    return searchHook.processContent(baseContent);
  };

  // Load all content when switching to list view
  useEffect(() => {
    if (searchHook.viewMode === 'list' && contentHook.allContent.length === 0) {
      contentHook.loadAllContent();
    }
  }, [searchHook.viewMode]);

  // Auto-refresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (!uploadHook.uploading) {
        contentHook.refreshCategoryCounts();
      }
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [uploadHook.uploading]);

  const displayContent = getDisplayContent();
  const availableTags = searchHook.getAllAvailableTags(
    searchHook.searchQuery.trim() ? searchHook.searchResults : contentHook.categoryContent
  );

  if (contentHook.loading) {
    return (
      <div className="min-h-screen bg-library-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-brass border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-wood-dark">Loading library...</p>
        </div>
      </div>
    );
  }

  if (contentHook.error) {
    return (
      <div className="min-h-screen bg-library-gradient flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{contentHook.error}</p>
          <button
            onClick={() => contentHook.loadLibraryData()}
            className="px-4 py-2 bg-brass text-white rounded-lg hover:bg-brass-dark"
          >
            Try Again
          </button>
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
          <h1 className="text-2xl font-cormorant text-brass">📚 Library Stacks</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button
            onClick={() => uploadHook.setShowUploadModal(true)}
            disabled={uploadHook.uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brass/20 text-brass hover:bg-brass/30 transition-colors duration-300 disabled:opacity-50"
          >
            <Upload size={18} />
            <span className="font-cormorant">
              {uploadHook.uploading ? 'Uploading...' : 'Upload Files'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Category Navigation */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {Object.entries(contentHook.categories).map(([key, category]) => (
            <button
              key={key}
              onClick={() => handleCategoryChange(key)}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                contentHook.selectedCategory === key
                  ? 'border-brass bg-brass/10 text-brass'
                  : 'border-wood-light/30 bg-white hover:border-brass/50 hover:bg-brass/5 text-wood-dark'
              }`}
            >
              <div className="text-2xl mb-2">{category.icon}</div>
              <div className="font-cormorant font-semibold">{category.name}</div>
              <div className="text-sm opacity-75">{category.count} items</div>
            </button>
          ))}
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-3">
            <SearchBar
              searchQuery={searchHook.searchQuery}
              onSearchChange={searchHook.setSearchQuery}
              onClearSearch={() => searchHook.setSearchQuery('')}
            />
          </div>
          <div>
            <FilterControls
              viewMode={searchHook.viewMode}
              onViewModeChange={searchHook.setViewMode}
              filterMode={searchHook.filterMode}
              onFilterModeChange={searchHook.setFilterMode}
              sortMode={searchHook.sortMode}
              onSortModeChange={searchHook.setSortMode}
              multiTagFilters={searchHook.multiTagFilters}
              onMultiTagChange={searchHook.handleMultiTagChange}
              onMultiTagOperatorChange={searchHook.handleMultiTagOperatorChange}
              availableTags={availableTags}
              onClearFilters={searchHook.clearFilters}
            />
          </div>
        </div>

        {/* Content Display */}
        <div className="mb-8">
          {displayContent.length > 0 ? (
            <ContentGrid
              content={displayContent}
              viewMode={searchHook.viewMode}
              onContentAction={handleContentAction}
              onTagsChange={contentHook.handleTagsChange}
              updatingTags={contentHook.updatingTags}
              searchQuery={searchHook.searchQuery}
            />
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4 opacity-60">📁</div>
              <p className="text-wood-dark/70 text-lg">
                {searchHook.searchQuery.trim() 
                  ? 'No content found matching your search.'
                  : 'No content in this category yet.'}
              </p>
              {!searchHook.searchQuery.trim() && (
                <button
                  onClick={() => uploadHook.setShowUploadModal(true)}
                  className="mt-4 px-6 py-2 bg-brass text-white rounded-lg hover:bg-brass-dark transition-colors"
                >
                  Upload Your First File
                </button>
              )}
            </div>
          )}
        </div>

        {/* AI Analysis Panel */}
        {selectedContentForSummary && (
          <div className="fixed bottom-6 right-6 bg-white rounded-lg shadow-lg border border-wood-light/30 p-4 max-w-sm">
            <h3 className="font-cormorant font-semibold text-wood-dark mb-2">
              AI Analysis: {selectedContentForSummary.title}
            </h3>
            {aiAnalysisLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-brass border-t-transparent rounded-full"></div>
                <span className="text-sm text-wood-dark/70">Analyzing...</span>
              </div>
            ) : aiAnalysisFailed ? (
              <p className="text-sm text-red-600">Analysis failed. Please try again.</p>
            ) : (
              <div className="text-sm text-wood-dark/70">
                <p>Key themes: {selectedContentForSummary.key_themes?.length || 0}</p>
                <p>Questions: {selectedContentForSummary.thought_questions?.length || 0}</p>
              </div>
            )}
            <button
              onClick={() => setSelectedContentForSummary(null)}
              className="mt-2 text-xs text-wood-dark/60 hover:text-wood-dark"
            >
              Close
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <ContentViewer
        showContentViewer={contentHook.showContentViewer}
        selectedContent={contentHook.selectedContent}
        onClose={() => contentHook.setShowContentViewer(false)}
        onContentAction={handleContentAction}
      />

      <UploadModal
        showUploadModal={uploadHook.showUploadModal}
        onClose={() => uploadHook.setShowUploadModal(false)}
        selectedCategory={contentHook.selectedCategory}
        categories={contentHook.categories}
        onCategoryChange={contentHook.setSelectedCategory}
        onFileSelect={() => uploadHook.triggerFileSelect()}
        onDragOver={uploadHook.handleDragOver}
        onDrop={(e) => uploadHook.handleDrop(e, contentHook.selectedCategory, handleUploadSuccess)}
        uploading={uploadHook.uploading}
        createFileInput={() => uploadHook.createFileInput(contentHook.selectedCategory, handleUploadSuccess)}
      />
    </div>
  );
};

export default LibraryStacks;