import React from 'react';
import { X, Download, Edit3, Trash2, Calendar, FileText, Tag } from 'lucide-react';

const ContentViewer = ({
  showContentViewer,
  selectedContent,
  onClose,
  onContentAction
}) => {
  if (!showContentViewer || !selectedContent) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-wood-light/30">
          <div className="flex-1 min-w-0">
            <h2 className="text-2xl font-cormorant text-wood-dark mb-2">
              {selectedContent.title || 'Untitled'}
            </h2>
            <div className="flex items-center gap-4 text-sm text-wood-dark/70">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brass/10 text-brass border border-brass/20">
                {selectedContent.category}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {formatDate(selectedContent.date_modified || selectedContent.date_created)}
              </span>
              <span className="flex items-center gap-1">
                <FileText size={14} />
                {formatFileSize(selectedContent.size_bytes)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => onContentAction('edit', selectedContent)}
              className="p-2 text-wood-dark/60 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit3 size={18} />
            </button>
            <button
              onClick={() => onContentAction('download', selectedContent)}
              className="p-2 text-wood-dark/60 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
              title="Download"
            >
              <Download size={18} />
            </button>
            <button
              onClick={() => onContentAction('delete', selectedContent)}
              className="p-2 text-wood-dark/60 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 size={18} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-wood-dark/60 hover:text-wood-dark hover:bg-wood-light/10 rounded-lg transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Key Themes Box */}
        {selectedContent.key_themes && selectedContent.key_themes.length > 0 && (
          <div className="px-6 py-4 bg-brass/5 border-b border-brass/20">
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-brass uppercase tracking-wide">Key Themes</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedContent.key_themes.map((theme, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-brass/10 text-brass border border-brass/30 rounded-md text-sm font-medium"
                >
                  {theme}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {selectedContent.tags && selectedContent.tags.length > 0 && (
          <div className="px-6 py-3 border-b border-wood-light/20">
            <div className="flex flex-wrap gap-2">
              {selectedContent.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-wood-light/20 text-wood-dark border border-wood-light/30"
                >
                  <Tag size={12} className="mr-1" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="prose prose-wood max-w-none">
            {selectedContent.content ? (
              <div className="whitespace-pre-wrap text-wood-dark leading-relaxed">
                {selectedContent.content}
              </div>
            ) : (
              <p className="text-wood-dark/60 italic">No content available</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-wood-light/30 bg-wood-light/5">
          <div className="text-sm text-wood-dark/60">
            Created: {formatDate(selectedContent.date_created)}
            {selectedContent.date_modified && selectedContent.date_modified !== selectedContent.date_created && (
              <span className="ml-4">
                Modified: {formatDate(selectedContent.date_modified)}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-brass text-white hover:bg-brass-dark rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentViewer;