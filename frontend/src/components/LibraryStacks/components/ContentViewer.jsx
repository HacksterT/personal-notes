import React from 'react';
import { X, Download, Edit3, Trash2, Calendar, FileText, Tag, Brain, BookOpen, Clock, AlertCircle, CheckCircle, Loader } from 'lucide-react';

const ContentViewer = ({
  showContentViewer,
  selectedContent,
  onClose,
  onContentAction
}) => {
  if (!showContentViewer || !selectedContent) return null;

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getProcessingStatusDisplay = (status) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, text: 'AI Analysis Complete', color: 'text-green-600' };
      case 'pending':
        return { icon: Loader, text: 'Processing...', color: 'text-yellow-600' };
      case 'error':
        return { icon: AlertCircle, text: 'Processing Failed', color: 'text-red-600' };
      default:
        return { icon: Clock, text: 'Not Processed', color: 'text-gray-500' };
    }
  };

  const formatProcessingTime = (seconds) => {
    if (!seconds) return null;
    return seconds < 1 ? '<1s' : `${Math.round(seconds)}s`;
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
            {/* Metadata */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Created: {new Date(selectedContent.date_created).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span>Modified: {new Date(selectedContent.date_modified).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <FileText className="w-4 h-4 mr-2" />
                <span>Size: {formatFileSize(selectedContent.size_bytes)}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <FileText className="w-4 h-4 mr-2" />
                <span>Type: {selectedContent.file_type || 'Unknown'}</span>
              </div>
              {selectedContent.word_count && (
                <div className="flex items-center text-sm text-gray-600">
                  <FileText className="w-4 h-4 mr-2" />
                  <span>Words: {selectedContent.word_count.toLocaleString()}</span>
                </div>
              )}
              {selectedContent.processing_status && (
                <div className="flex items-center text-sm">
                  {(() => {
                    const status = getProcessingStatusDisplay(selectedContent.processing_status);
                    const StatusIcon = status.icon;
                    return (
                      <>
                        <StatusIcon className={`w-4 h-4 mr-2 ${status.color}`} />
                        <span className={status.color}>
                          {status.text}
                          {selectedContent.ai_processing_time_seconds && formatProcessingTime(selectedContent.ai_processing_time_seconds) && (
                            <span className="ml-1 text-gray-500">
                              ({formatProcessingTime(selectedContent.ai_processing_time_seconds)})
                            </span>
                          )}
                        </span>
                      </>
                    );
                  })()} 
                </div>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-wood-dark/70">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-brass/10 text-brass border border-brass/20">
                {selectedContent.category}
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

        {/* Main Bible Passage */}
        {selectedContent.passage && (
          <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wide flex items-center">
                <BookOpen className="w-4 h-4 mr-2" />
                Main Passage
              </h3>
            </div>
            <p className="text-blue-900 font-medium">{selectedContent.passage}</p>
          </div>
        )}

        {/* Bible References */}
        {selectedContent.bible_references && selectedContent.bible_references.length > 0 && (
          <div className="px-6 py-4 bg-green-50 border-b border-green-200">
            <div className="mb-2">
              <h3 className="text-sm font-semibold text-green-800 uppercase tracking-wide flex items-center">
                <BookOpen className="w-4 h-4 mr-2" />
                Bible References
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedContent.bible_references.map((reference, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-green-100 text-green-800 border border-green-300 rounded-md text-sm font-medium"
                >
                  {reference}
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

        {/* Thought Questions */}
        {selectedContent.thought_questions && selectedContent.thought_questions.length > 0 && (
          <div className="px-6 py-4 bg-purple-50 border-t border-purple-200">
            <div className="mb-3">
              <h3 className="text-sm font-semibold text-purple-800 uppercase tracking-wide flex items-center">
                <Brain className="w-4 h-4 mr-2" />
                Thought Questions
              </h3>
            </div>
            <div className="space-y-2">
              {selectedContent.thought_questions.map((question, index) => (
                <div
                  key={index}
                  className="p-3 bg-purple-100 border border-purple-200 rounded-lg"
                >
                  <p className="text-purple-900 text-sm leading-relaxed">
                    {index + 1}. {question}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end p-6 border-t border-wood-light/30 bg-wood-light/5">
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