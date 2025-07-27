import React from 'react';
import { Save, Loader2 } from 'lucide-react';

const SaveModal = ({
  showSaveModal,
  isSaving,
  studyNotes,
  editorCategory,
  extractTitle,
  onConfirmSave,
  onCancel
}) => {
  if (!showSaveModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <h3 className="text-xl font-cormorant text-library-dark mb-4">
          Confirm Save
        </h3>
        
        <div className="space-y-3 mb-6">
          <div>
            <label className="text-sm font-medium text-wood-dark">Title:</label>
            <p className="text-library-dark bg-gray-50 p-2 rounded border">
              {extractTitle(studyNotes)}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-wood-dark">Category:</label>
            <p className="text-library-dark bg-gray-50 p-2 rounded border capitalize">
              {editorCategory === 'study-notes' ? 'Study Notes' : 'Journal'}
            </p>
          </div>
          
          <div>
            <label className="text-sm font-medium text-wood-dark">Content Preview:</label>
            <p className="text-library-dark bg-gray-50 p-2 rounded border text-sm max-h-20 overflow-y-auto">
              {studyNotes.substring(0, 200)}{studyNotes.length > 200 ? '...' : ''}
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
                Confirm Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SaveModal;