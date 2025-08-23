import React, { useState } from 'react';
import { Eye, Edit3, Trash2, Download, Share2, Calendar, FileText, BookPlus } from 'lucide-react';
import TagBoxesPost from '../../Settings/shared/TagBoxesPost';
import TagBoxes from '../../Settings/shared/TagBoxes';
import DownloadDropdown from './DownloadDropdown';
import ActiveResourcesToast from './ActiveResourcesToast';

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
    
    return html;
  };

  return (
    <div 
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  );
};

// Loading skeleton for content cards
const ContentCardSkeleton = () => (
  <div className="content-card-skeleton">
    <div className="skeleton-header">
      <div className="skeleton h-6 rounded mb-2"></div>
      <div className="flex items-center gap-2">
        <div className="skeleton h-5 w-20 rounded-full"></div>
        <div className="skeleton h-4 w-12 rounded"></div>
      </div>
    </div>
    <div className="skeleton-body">
      <div className="skeleton h-4 rounded mb-2"></div>
      <div className="skeleton h-4 w-3/4 rounded mb-2"></div>
      <div className="skeleton h-4 w-1/2 rounded mb-3"></div>
      <div className="flex gap-1 mb-3">
        <div className="skeleton h-6 w-12 rounded"></div>
        <div className="skeleton h-6 w-12 rounded"></div>
        <div className="skeleton h-6 w-12 rounded"></div>
      </div>
      <div className="skeleton h-3 w-24 rounded"></div>
    </div>
    <div className="skeleton-actions">
      <div className="flex gap-2">
        <div className="skeleton h-8 w-8 rounded"></div>
        <div className="skeleton h-8 w-8 rounded"></div>
      </div>
      <div className="flex gap-1">
        <div className="skeleton h-8 w-8 rounded"></div>
        <div className="skeleton h-8 w-8 rounded"></div>
        <div className="skeleton h-8 w-8 rounded"></div>
      </div>
    </div>
  </div>
);

const ContentGrid = ({
  content,
  viewMode,
  onContentAction,
  onTagsChange,
  selectedArtifact,
  onArtifactSelect,
  handleDownload,
  loading = false,
  activeResourcesCount = 0
}) => {
  const [toast, setToast] = useState({ isVisible: false, message: '', type: 'success' });

  const handleAddToActiveResources = (item) => {
    // Get current active resources from localStorage
    const getCurrentActiveResourcesCount = () => {
      try {
        const stored = localStorage.getItem('activeResources');
        if (stored) {
          const resources = JSON.parse(stored);
          return resources.length;
        }
        return 0;
      } catch (error) {
        console.error('Failed to read active resources from localStorage:', error);
        return 0;
      }
    };

    const currentCount = getCurrentActiveResourcesCount();
    
    // Check if active resources is full (5 is the limit)
    if (currentCount >= 5) {
      setToast({
        isVisible: true,
        message: 'Active resources is full, please remove one first',
        type: 'warning'
      });
    } else {
      // Add to active resources
      onContentAction('addToActiveResources', item);
      const newCount = currentCount + 1;
      setToast({
        isVisible: true,
        message: `Content added to active resources ${newCount}/5`,
        type: 'success'
      });
    }
  };

  const closeToast = () => {
    setToast({ isVisible: false, message: '', type: 'success' });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const truncateContent = (text, maxLength = 150) => {
    if (!text) return 'No content available';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Show loading skeletons
  if (loading) {
    const skeletonCards = Array.from({ length: 6 }, (_, i) => (
      <ContentCardSkeleton key={`skeleton-${i}`} />
    ));
    
    return (
      <div className={viewMode === 'list' ? 'content-grid-list-view space-y-2' : 'content-grid-card-view'}>
        {skeletonCards}
      </div>
    );
  }

  if (viewMode === 'list') {
    return (
      <div className="content-grid-list-view space-y-2">
        {content.map((item) => {
          const isSelected = selectedArtifact && selectedArtifact.id === item.id;
          return (
            <div 
              key={item.id} 
              className={`content-list-item ${isSelected ? 'selected' : ''}`}
              onClick={() => onArtifactSelect(item)}
            >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h3 className="font-cormorant font-semibold text-wood-dark text-lg truncate">
                    {item.title || 'Untitled'}
                  </h3>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brass/10 text-brass border border-brass/20">
                    {item.category}
                  </span>
                  {/* Social Media Post Tags - to the right of category */}
                  {item.category === 'social-media-posts' && (
                    <TagBoxesPost
                      postTags={item.post_tags || []}
                      contentId={item.id}
                      onPostTagsChange={onTagsChange}
                    />
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-wood-dark/70 mt-1">
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(item.date_modified || item.date_created)}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText size={12} />
                    {formatFileSize(item.size_bytes)}
                  </span>
                </div>
                
                {/* Interactive Tag Editing */}
                <div className="mt-2">
                  <TagBoxes
                    tags={item.tags || []}
                    category={item.category}
                    compact={true}
                    contentId={item.id}
                    onTagsChange={onTagsChange}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onContentAction('view', item);
                  }}
                  className="action-btn-view"
                  title="View"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onContentAction('edit', item);
                  }}
                  className="action-btn-edit"
                  title="Edit"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToActiveResources(item);
                  }}
                  className="action-btn-add-resources"
                  title="Add to Active Resources"
                >
                  <BookPlus size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onContentAction('download', item);
                  }}
                  className="action-btn-download"
                  title="Download"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onContentAction('delete', item);
                  }}
                  className="action-btn-delete"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>
    );
  }

  // Card view
  return (
    <div className="content-grid-card-view">
      {content.map((item) => {
        const isSelected = selectedArtifact && selectedArtifact.id === item.id;
        return (
        <div 
          key={item.id} 
          className={`content-grid-card ${isSelected ? 'selected' : ''}`}
          onClick={() => onArtifactSelect(item)}
        >
          {/* Card Header */}
          <div className="content-card-header">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="font-cormorant font-semibold text-wood-dark text-base md:text-lg leading-tight truncate flex-1" title={item.title}>
                    {item.title || 'Untitled'}
                  </h3>
                  {/* Social Media Post Tags - next to title */}
                  {item.category === 'social-media-posts' && (
                    <TagBoxesPost
                      postTags={item.post_tags || []}
                      contentId={item.id}
                      onPostTagsChange={onTagsChange}
                    />
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-wood-dark/70">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brass/10 text-brass border border-brass/20">
                    {item.category}
                  </span>
                  <span>{formatFileSize(item.size_bytes)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card Content */}
          <div className="content-card-body">
            <div className="text-sm text-wood-dark/80 leading-relaxed mb-3">
              {item.content ? (
                <MarkdownRenderer content={truncateContent(item.content)} />
              ) : (
                <p className="italic text-wood-dark/60">No content preview available</p>
              )}
            </div>

            {/* Regular Tag Editing - for all categories including social-media-posts */}
            <div className="mb-3">
              <TagBoxes
                tags={item.tags || []}
                category={item.category}
                compact={true}
                contentId={item.id}
                onTagsChange={onTagsChange}
              />
            </div>

            {/* Date */}
            <div className="text-xs text-wood-dark/60 mb-3 flex items-center gap-1">
              <Calendar size={12} />
              Modified: {formatDate(item.date_modified || item.date_created)}
            </div>
          </div>

          {/* Card Actions */}
          <div className="content-card-actions">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onContentAction('view', item);
                }}
                className="action-btn-view"
                title="View"
              >
                <Eye size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onContentAction('edit', item);
                }}
                className="action-btn-edit"
                title="Edit"
              >
                <Edit3 size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAddToActiveResources(item);
                }}
                className="action-btn-add-resources"
                title="Add to Active Resources"
              >
                <BookPlus size={16} />
              </button>
            </div>
            
            <div className="flex items-center gap-1">
              <DownloadDropdown 
                item={item} 
                onDownload={handleDownload} 
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onContentAction('share', item);
                }}
                className="action-btn-share"
                title="Share"
              >
                <Share2 size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onContentAction('delete', item);
                }}
                className="action-btn-delete"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
        );
      })}
      
      {/* Active Resources Toast */}
      <ActiveResourcesToast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={closeToast}
      />
    </div>
  );
};

export default React.memo(ContentGrid);