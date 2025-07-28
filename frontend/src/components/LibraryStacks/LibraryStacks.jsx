import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload } from "lucide-react";

// Import hooks
import { useContentManagement } from "./hooks/useContentManagement";
import { useSearchAndFilter } from "./hooks/useSearchAndFilter";
import { useFileUpload } from "./hooks/useFileUpload";

// Import components
import ContentGrid from "./components/ContentGrid";
import ContentViewer from "./components/ContentViewer";
import UploadModal from "./components/UploadModal";
import FilterControls from "./components/FilterControls";
import SearchBar from "./components/SearchBar";
import ErrorBoundary from "./components/ErrorBoundary";
import ErrorToast from "./components/ErrorToast";

// Import shared components
import NavigationMenu from "../Library/NavigationMenu";

const LibraryStacks = () => {
  const navigate = useNavigate();

  // Use custom hooks
  const contentHook = useContentManagement();
  const searchHook = useSearchAndFilter();
  const uploadHook = useFileUpload();

  // Selected artifact state for Key Themes
  const [selectedArtifact, setSelectedArtifact] = useState(null);

  // Get error state from content hook for error toast display
  const activeErrors = contentHook.errorHandler?.getActiveErrors() || [];

  // Handle category change
  const handleCategoryChange = useCallback(async (categoryKey) => {
    await contentHook.handleCategoryChange(categoryKey);
    searchHook.setSearchQuery(""); // Clear search when selecting category
    setSelectedArtifact(null); // Reset selected artifact when changing categories
  }, [contentHook.handleCategoryChange, searchHook.setSearchQuery]);

  // Handle artifact selection for Key Themes
  const handleArtifactSelect = useCallback((item) => {
    setSelectedArtifact(item);
  }, []);

  // Handle content actions with navigation
  const handleContentAction = useCallback(async (action, item) => {
    if (action === "edit") {
      // Store content in localStorage for StudyHall
      localStorage.setItem(
        "editingContent",
        JSON.stringify({
          id: item.id,
          title: item.title,
          content: item.content,
          category: item.category,
        })
      );

      // Navigate to StudyHall
      navigate("/study-hall");
      return;
    }

    // Handle other actions through content hook
    await contentHook.handleContentAction(action, item);
  }, [navigate, contentHook.handleContentAction]);

  // Handle file upload success
  const handleUploadSuccess = useCallback(async (category) => {
    await contentHook.refreshCategoryCounts();
    await contentHook.loadCategoryContent(category);
  }, [contentHook.refreshCategoryCounts, contentHook.loadCategoryContent]);

  // Prepare content for display with memoization
  const displayContent = useMemo(() => {
    const baseContent = searchHook.searchQuery.trim()
      ? searchHook.searchResults
      : searchHook.viewMode === "list"
      ? contentHook.allContent
      : contentHook.categoryContent;

    return searchHook.processContent(baseContent);
  }, [
    searchHook.searchQuery,
    searchHook.searchResults,
    searchHook.viewMode,
    contentHook.allContent,
    contentHook.categoryContent,
    searchHook.processContent
  ]);

  // Load all content when switching to list view
  useEffect(() => {
    if (searchHook.viewMode === "list" && contentHook.allContent.length === 0) {
      contentHook.loadAllContent();
    }
  }, [searchHook.viewMode]);

  // Memoize available tags calculation
  const availableTags = useMemo(() => {
    const sourceContent = searchHook.searchQuery.trim()
      ? searchHook.searchResults
      : contentHook.categoryContent;
    return searchHook.getAllAvailableTags(sourceContent);
  }, [
    searchHook.searchQuery,
    searchHook.searchResults,
    contentHook.categoryContent,
    searchHook.getAllAvailableTags
  ]);

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
          <h1 className="text-2xl font-cormorant text-brass">
            📚 Library Stacks
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => uploadHook.setShowUploadModal(true)}
            disabled={uploadHook.uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brass/20 text-brass hover:bg-brass/30 transition-colors duration-300 disabled:opacity-50"
          >
            <Upload size={18} />
            <span className="font-cormorant">
              {uploadHook.uploading ? "Uploading..." : "Upload Files"}
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
                  ? "border-brass bg-brass/10 text-brass"
                  : "border-wood-light/30 bg-white hover:border-brass/50 hover:bg-brass/5 text-wood-dark"
              }`}
            >
              <div className="text-2xl mb-2">{category.icon}</div>
              <div className="font-cormorant font-semibold">
                {category.name}
              </div>
              <div className="text-sm opacity-75">{category.count} items</div>
            </button>
          ))}
        </div>

        {/* Search and Filters with Key Themes */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-3 flex flex-col h-[370px]">
            <div className="h-[50px]">
              <ErrorBoundary componentName="Search Bar">
                <SearchBar
                  searchQuery={searchHook.searchQuery}
                  onSearchChange={searchHook.setSearchQuery}
                  onClearSearch={() => searchHook.setSearchQuery("")}
                />
              </ErrorBoundary>
            </div>

            {/* Key Themes Box - Fixed size aligned with search bar */}
            <div className="bg-white rounded-lg border border-brass/30 shadow-sm flex-1 mt-4 overflow-hidden">
              {selectedArtifact ? (
                <div className="h-full flex flex-col">
                  <div className="px-4 py-2 bg-brass/5 border-b border-brass/20">
                    <h3 className="text-sm font-semibold text-brass uppercase tracking-wide">
                      Key Themes: {selectedArtifact.title}
                    </h3>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto">
                    {selectedArtifact.key_themes &&
                    selectedArtifact.key_themes.length > 0 ? (
                      <ul className="space-y-2">
                        {selectedArtifact.key_themes.map((theme, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-brass mr-2 text-sm leading-5">
                              •
                            </span>
                            <span className="text-wood-dark text-sm leading-5 font-medium">
                              {theme}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-wood-dark/60 italic text-sm">
                        No key themes available for this artifact.
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                  <h3 className="text-sm font-semibold text-brass uppercase tracking-wide mb-2">
                    Key Themes
                  </h3>
                  <p className="text-wood-dark/70 text-sm">
                    Select an artifact below to view its key themes and get a
                    quick overview of its content.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <ErrorBoundary componentName="Filter Controls">
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
            </ErrorBoundary>
          </div>
        </div>

        {/* Content Display */}
        <div className="mb-8">
          {displayContent.length > 0 ? (
            <ErrorBoundary componentName="Content Grid">
              <ContentGrid
                content={displayContent}
                viewMode={searchHook.viewMode}
                onContentAction={handleContentAction}
                onTagsChange={contentHook.handleTagsChange}
                updatingTags={contentHook.updatingTags}
                selectedArtifact={selectedArtifact}
                onArtifactSelect={handleArtifactSelect}
                handleDownload={contentHook.handleDownload}
              />
            </ErrorBoundary>
          ) : (
            <div className="text-center py-12">
              <div className="text-4xl mb-4 opacity-60">📁</div>
              <p className="text-wood-dark/70 text-lg">
                {searchHook.searchQuery.trim()
                  ? "No content found matching your search."
                  : "No content in this category yet."}
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
      </div>

      {/* Modals */}
      <ErrorBoundary componentName="Content Viewer">
        <ContentViewer
          showContentViewer={contentHook.showContentViewer}
          selectedContent={contentHook.selectedContent}
          onClose={() => contentHook.setShowContentViewer(false)}
          onContentAction={handleContentAction}
        />
      </ErrorBoundary>

      <ErrorBoundary componentName="Upload Modal">
        <UploadModal
          showUploadModal={uploadHook.showUploadModal}
          onClose={() => uploadHook.setShowUploadModal(false)}
          selectedCategory={contentHook.selectedCategory}
          categories={contentHook.categories}
          onCategoryChange={contentHook.setSelectedCategory}
          onFileSelect={() => uploadHook.triggerFileSelect()}
          onDragOver={uploadHook.handleDragOver}
          onDrop={(e) =>
            uploadHook.handleDrop(
              e,
              contentHook.selectedCategory,
              handleUploadSuccess
            )
          }
          uploading={uploadHook.uploading}
          getFileInputProps={() =>
            uploadHook.getFileInputProps(
              contentHook.selectedCategory,
              handleUploadSuccess
            )
          }
        />
      </ErrorBoundary>

      {/* Error Toast for non-critical errors */}
      <ErrorToast
        errors={activeErrors}
        onDismiss={(errorKey) => contentHook.errorHandler?.dismissError(errorKey)}
      />
    </div>
  );
};

export default LibraryStacks;
