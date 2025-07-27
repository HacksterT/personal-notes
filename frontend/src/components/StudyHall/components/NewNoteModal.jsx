import React from 'react';

const NewNoteModal = ({
  showNewNoteModal,
  onSaveBeforeNew,
  onDontSaveNew,
  onCancel
}) => {
  if (!showNewNoteModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-cormorant text-library-dark mb-4">
          Unsaved Changes
        </h3>
        <p className="text-wood-dark mb-6">
          You have unsaved changes. Do you want to save before creating a new note?
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-wood-dark hover:bg-gray-100 rounded transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onDontSaveNew}
            className="px-4 py-2 text-wood-dark hover:bg-gray-100 rounded transition-colors"
          >
            No
          </button>
          <button
            onClick={onSaveBeforeNew}
            className="px-4 py-2 bg-brass text-white hover:bg-brass/90 rounded transition-colors"
          >
            Yes
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewNoteModal;