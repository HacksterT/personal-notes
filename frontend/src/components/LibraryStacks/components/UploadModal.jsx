import React from 'react';
import { Upload, X } from 'lucide-react';

const UploadModal = ({
  showUploadModal,
  onClose,
  selectedCategory,
  categories,
  onCategoryChange,
  onFileSelect,
  onDragOver,
  onDrop,
  uploading,
  getFileInputProps
}) => {
  if (!showUploadModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-cormorant text-wood-dark">
            Upload Files
          </h3>
          <button
            onClick={onClose}
            className="text-wood-dark/60 hover:text-wood-dark"
            disabled={uploading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Category Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-wood-dark mb-2">
            Upload to Category:
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3 py-2 border border-wood-light/30 rounded-lg focus:ring-2 focus:ring-brass/50 focus:border-brass text-wood-dark"
            disabled={uploading}
          >
            {Object.entries(categories).map(([key, category]) => (
              <option key={key} value={key}>
                {category.icon} {category.name}
              </option>
            ))}
          </select>
        </div>

        {/* Drop Zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            uploading
              ? 'border-wood-light/30 bg-wood-light/10'
              : 'border-wood-light/50 hover:border-brass/50 hover:bg-brass/5'
          }`}
          onDragOver={onDragOver}
          onDrop={onDrop}
        >
          <Upload className={`mx-auto h-12 w-12 mb-4 ${
            uploading ? 'text-wood-dark/40' : 'text-wood-dark/60'
          }`} />
          
          {uploading ? (
            <div>
              <p className="text-wood-dark/60">Uploading files...</p>
              <div className="mt-2 bg-wood-light/20 rounded-full h-2">
                <div className="bg-brass h-2 rounded-full animate-pulse w-1/2"></div>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-wood-dark mb-2">
                Drag and drop files here, or{' '}
                <button
                  onClick={onFileSelect}
                  className="text-brass hover:text-brass-dark underline"
                >
                  browse
                </button>
              </p>
              <p className="text-sm text-wood-dark/60">
                Supports: .txt, .md, .pdf, .docx
              </p>
            </div>
          )}
        </div>

        {/* Hidden File Input */}
        <input {...getFileInputProps()} />

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-wood-dark hover:text-wood-dark/80 transition-colors"
            disabled={uploading}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;