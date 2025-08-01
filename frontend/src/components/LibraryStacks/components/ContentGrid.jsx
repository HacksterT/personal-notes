import React from 'react';
import { Eye, Edit3, Trash2, Download, Share2, Calendar, FileText, Tag } from 'lucide-react';
import TagBoxesPost from '../../Settings/shared/TagBoxesPost';
import DownloadDropdown from './DownloadDropdown';

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

const ContentGrid = ({
  content,
  viewMode,
  onContentAction,
  onTagsChange,
  updatingTags,
  selectedArtifact,
  onArtifactSelect,
  handleDownload
}) => {
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

  if (viewMode === 'list') {
    return (
      <div className="space-y-2">
        {content.map((item) => {
          const isSelected = selectedArtifact && selectedArtifact.id === item.id;
          return (
            <div 
              key={item.id} 
              className={`bg-white rounded-lg border p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${
                isSelected 
                  ? 'border-yellow-400 border-2 bg-yellow-50' 
                  : 'border-wood-light/30 hover:border-brass/40'
              }`}
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
                
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {item.tags.slice(0, 4).map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-wood-light/20 text-wood-dark border border-wood-light/30"
                      >
                        <Tag size={10} className="mr-1" />
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 4 && (
                      <span className="text-xs text-wood-dark/60 px-2 py-1">
                        +{item.tags.length - 4} more
                      </span>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onContentAction('view', item);
                  }}
                  className="p-2 text-wood-dark/60 hover:text-brass hover:bg-brass/10 rounded-lg transition-colors"
                  title="View"
                >
                  <Eye size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onContentAction('edit', item);
                  }}
                  className="p-2 text-wood-dark/60 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onContentAction('download', item);
                  }}
                  className="p-2 text-wood-dark/60 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onContentAction('delete', item);
                  }}
                  className="p-2 text-wood-dark/60 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {content.map((item) => {
        const isSelected = selectedArtifact && selectedArtifact.id === item.id;
        return (
        <div 
          key={item.id} 
          className={`bg-white rounded-lg border shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer ${
            isSelected 
              ? 'border-yellow-400 border-2 bg-yellow-50' 
              : 'border-wood-light/30 hover:border-brass/40'
          }`}
          onClick={() => onArtifactSelect(item)}
        >
          {/* Card Header */}
          <div className="p-3 md:p-4 border-b border-wood-light/20">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-cormorant font-semibold text-wood-dark text-base md:text-lg leading-tight mb-2 truncate" title={item.title}>
                  {item.title || 'Untitled'}
                </h3>
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
          <div className="p-3 md:p-4">
            <div className="text-sm text-wood-dark/80 leading-relaxed mb-3">
              {item.content ? (
                <MarkdownRenderer content={truncateContent(item.content)} />
              ) : (
                <p className="italic text-wood-dark/60">No content preview available</p>
              )}
            </div>

            {/* Tags */}
            {item.category === 'social-media-posts' ? (
              <TagBoxesPost
                tags={item.tags || []}
                postTags={item.post_tags || []}
                contentId={item.id}
                onTagsChange={onTagsChange}
                loading={updatingTags.has(item.id)}
                compact={true}
              />
            ) : (
              item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {item.tags.slice(0, 4).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-wood-light/20 text-wood-dark border border-wood-light/30"
                    >
                      <Tag size={10} className="mr-1" />
                      {tag}
                    </span>
                  ))}
                  {item.tags.length > 4 && (
                    <span className="text-xs text-wood-dark/60 px-2 py-1">
                      +{item.tags.length - 4} more
                    </span>
                  )}
                </div>
              )
            )}

            {/* Date */}
            <div className="text-xs text-wood-dark/60 mb-3 flex items-center gap-1">
              <Calendar size={12} />
              Modified: {formatDate(item.date_modified || item.date_created)}
            </div>
          </div>

          {/* Card Actions */}
          <div className="px-3 md:px-4 py-3 bg-wood-light/10 border-t border-wood-light/20 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onContentAction('view', item);
                }}
                className="p-2 text-wood-dark/60 hover:text-brass hover:bg-brass/10 rounded-lg transition-colors"
                title="View"
              >
                <Eye size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onContentAction('edit', item);
                }}
                className="p-2 text-wood-dark/60 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit"
              >
                <Edit3 size={16} />
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
                className="p-2 text-wood-dark/60 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Share"
              >
                <Share2 size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onContentAction('delete', item);
                }}
                className="p-2 text-wood-dark/60 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
};

export default React.memo(ContentGrid);