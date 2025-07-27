import React from 'react';
import { Download, Edit3, Save, Eye, Edit } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

const SermonPreview = ({
  generatedSermon,
  sermonTitle,
  isEditingTitle,
  isEditingContent,
  editableContent,
  isPreviewMode,
  error,
  onTitleEdit,
  onStartEditing,
  onSaveEdit,
  onCancelEdit,
  onContentChange,
  onTogglePreview,
  onExport,
  onSave,
  showExportDropdown,
  onToggleExportDropdown,
  saveSuccess
}) => {
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <div className="text-red-600 mb-4">
            <div className="text-4xl mb-2">⚠️</div>
            <p className="text-lg font-medium">Generation Error</p>
          </div>
          <p className="text-red-600/80 text-sm max-w-md mx-auto leading-relaxed">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!generatedSermon) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-8">
          <div className="text-4xl mb-4 opacity-60">📜</div>
          <p className="text-wood-dark/70 text-lg">
            Generated sermon will appear here
          </p>
          <p className="text-wood-dark/60 text-sm mt-2">
            Configure your settings and click "Generate Sermon" to begin
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header with Title */}
      <div className="border-b border-wood-light/30 pb-4 mb-6">
        <div className="flex items-center justify-between mb-4">
          {isEditingTitle ? (
            <input
              type="text"
              value={sermonTitle}
              onChange={(e) => onTitleEdit(e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              onKeyPress={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              className="text-2xl font-cormorant text-wood-dark bg-transparent border-b border-brass focus:outline-none flex-1"
              autoFocus
            />
          ) : (
            <h2
              className="text-2xl font-cormorant text-wood-dark cursor-pointer hover:text-brass transition-colors flex-1"
              onClick={() => setIsEditingTitle(true)}
            >
              {sermonTitle || 'Generated Sermon'}
            </h2>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onTogglePreview}
            className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 ${
              isPreviewMode 
                ? 'bg-brass/20 text-brass border border-brass/30' 
                : 'bg-wood-light/20 text-wood-dark border border-wood-light/30 hover:bg-wood-light/30'
            }`}
          >
            {isPreviewMode ? <Edit size={16} /> : <Eye size={16} />}
            {isPreviewMode ? 'Edit' : 'Preview'}
          </button>

          {!isEditingContent && (
            <button
              onClick={onStartEditing}
              className="px-3 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors flex items-center gap-2 border border-blue-200"
            >
              <Edit3 size={16} />
              Edit Content
            </button>
          )}

          <div className="relative">
            <button
              onClick={onToggleExportDropdown}
              className="px-3 py-2 bg-green-50 text-green-600 hover:bg-green-100 rounded-lg transition-colors flex items-center gap-2 border border-green-200"
            >
              <Download size={16} />
              Export
            </button>
            
            {showExportDropdown && (
              <div className="absolute top-full right-0 mt-2 bg-white border border-wood-light/30 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => onExport('md')}
                  className="block w-full px-4 py-2 text-left text-wood-dark hover:bg-wood-light/10 rounded-t-lg"
                >
                  Markdown (.md)
                </button>
                <button
                  onClick={() => onExport('txt')}
                  className="block w-full px-4 py-2 text-left text-wood-dark hover:bg-wood-light/10"
                >
                  Text (.txt)
                </button>
                <button
                  onClick={() => onExport('docx')}
                  className="block w-full px-4 py-2 text-left text-wood-dark hover:bg-wood-light/10 rounded-b-lg"
                >
                  Word (.docx)
                </button>
              </div>
            )}
          </div>

          <button
            onClick={onSave}
            className="px-3 py-2 bg-brass/20 text-brass hover:bg-brass/30 rounded-lg transition-colors flex items-center gap-2 border border-brass/30"
          >
            <Save size={16} />
            Save to Library
          </button>
        </div>

        {/* Success Message */}
        {saveSuccess && (
          <div className="mt-3 p-3 bg-green-100 border border-green-300 rounded-lg">
            <p className="text-green-700 text-sm">
              ✅ Sermon saved successfully to your library!
            </p>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {isEditingContent ? (
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={onSaveEdit}
                className="px-4 py-2 bg-brass text-white hover:bg-brass/90 rounded-lg transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={onCancelEdit}
                className="px-4 py-2 bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
            <textarea
              value={editableContent}
              onChange={(e) => onContentChange(e.target.value)}
              className="flex-1 p-4 border border-wood-light/30 rounded-lg resize-none focus:outline-none focus:border-brass text-wood-dark font-mono text-sm leading-relaxed"
              placeholder="Edit your sermon content here..."
            />
          </div>
        ) : (
          <div className="prose prose-wood max-w-none">
            {isPreviewMode ? (
              <MarkdownRenderer content={generatedSermon} />
            ) : (
              <pre className="whitespace-pre-wrap font-mono text-sm text-wood-dark leading-relaxed">
                {generatedSermon}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SermonPreview;