import { useState, useRef } from 'react';
import { apiService } from '../../../services/api';

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file upload
  const handleFileUpload = async (files, category, onSuccess) => {
    // Prevent multiple simultaneous uploads
    if (uploading) {
      console.log('Upload already in progress, ignoring...');
      return;
    }
    setUploading(true);
    setUploadProgress([]);
    
    try {
      console.log(`📤 Uploading ${files.length} files to ${category}...`);
      
      // Upload files using API service
      const result = await apiService.uploadFiles(files, category);
      
      console.log(`✅ Upload complete: ${result.uploaded_count} files uploaded`);
      
      // Call success callback if provided
      if (onSuccess) {
        await onSuccess(category);
      }
      
      setShowUploadModal(false);
    } catch (error) {
      console.error('Upload failed:', error);
      throw error; // Re-throw to let parent handle the error
    } finally {
      // CRITICAL FIX: Always reset uploading state
      setUploading(false);
      
      // Force re-render of drag handlers
      setTimeout(() => {
        console.log('🔄 Upload state reset, ready for next upload');
      }, 100);
    }
  };

  // Handle file selection from input
  const handleFileSelect = (event, category, onSuccess) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      handleFileUpload(files, category, onSuccess);
    }
  };

  // Handle drag over
  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  // Handle file drop
  const handleDrop = (event, category, onSuccess) => {
    event.preventDefault();
    event.stopPropagation();

    console.log('🎯 Drop event triggered!', {
      uploading,
      fileCount: event.dataTransfer.files.length,
      timestamp: new Date().toISOString()
    });

    // Extra safety check
    if (uploading) {
      console.log('❌ Upload blocked - already uploading');
      return;
    }

    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      console.log(`📂 Processing ${files.length} dropped files`);
      handleFileUpload(files, category, onSuccess);
    } else {
      console.log('❌ No files detected in drop');
    }
  };

  // Trigger file input click
  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Clear file input
  const clearFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Create file input element (to be placed in component)
  const createFileInput = (category, onSuccess) => {
    return (
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".txt,.md,.pdf,.docx"
        onChange={(e) => handleFileSelect(e, category, onSuccess)}
        style={{ display: 'none' }}
      />
    );
  };

  return {
    // State
    uploading,
    uploadProgress,
    showUploadModal,
    fileInputRef,

    // Actions
    handleFileUpload,
    handleFileSelect,
    handleDragOver,
    handleDrop,
    triggerFileSelect,
    clearFileInput,
    setShowUploadModal,

    // Utilities
    createFileInput
  };
};