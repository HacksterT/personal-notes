import React from 'react';
import { Save, Loader2, X } from 'lucide-react';

const SaveModal = ({
  showSaveModal,
  isSaving,
  sermonTitle,
  generatedSermon,
  onConfirmSave,
  onCancel
}) => {
  if (!showSaveModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-cormorant text-wood-dark">
            Save Sermon to Library
          </h3>
          <button
            onClick={onCancel}
            className="text-wood-dark/60 hover:text-wood-dark"
            disabled={isSaving}
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-sm font-medium text-wood-dark">Title:</label>
            <p className="text-wood-dark bg-gray-50 p-2 rounded border mt-1">
              {sermonTitle || 'Untitled Sermon'}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-wood-dark">Category:</label>
            <p className="text-wood-dark bg-gray-50 p-2 rounded border mt-1">
              Sermons
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-wood-dark">Content Preview:</label>
            <p className="text-wood-dark bg-gray-50 p-2 rounded border text-sm max-h-20 overflow-y-auto mt-1">
              {generatedSermon.substring(0, 200)}{generatedSermon.length > 200 ? '...' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            onClick={onConfirmSave}
            className="px-4 py-2 bg-brass text-white rounded-lg hover:bg-brass/90 transition-colors flex items-center gap-2"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Saving...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Sermon
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveModal;