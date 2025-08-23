/**
 * useFileUpload Hook
 * 
 * This hook manages all file upload functionality for the LibraryStacks component.
 * Aligned with pure PostgreSQL storage architecture - files are uploaded, processed,
 * and stored directly in the database with automatic AI analysis.
 * 
 * Features:
 * - File selection via input or drag-and-drop
 * - File validation (type, size) before upload
 * - Upload processing with error handling
 * - Upload modal state management
 * - Upload state management to prevent concurrent uploads
 * - Integration with PostgreSQL storage backend
 */

import { useState, useRef, useCallback } from 'react';
import { apiService } from '../../../services/api';

// File validation constants aligned with storage architecture
const ALLOWED_FILE_TYPES = {
  '.txt': 'text/plain',
  '.md': 'text/markdown',
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
const MAX_FILES_PER_UPLOAD = 10;

// Error types for better error handling
const UPLOAD_ERRORS = {
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  TOO_MANY_FILES: 'TOO_MANY_FILES',
  UPLOAD_FAILED: 'UPLOAD_FAILED',
  NETWORK_ERROR: 'NETWORK_ERROR'
};

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const fileInputRef = useRef(null);

  // File validation function aligned with PostgreSQL storage architecture
  const validateFiles = useCallback((files) => {
    const errors = [];
    
    // Check number of files
    if (files.length > MAX_FILES_PER_UPLOAD) {
      errors.push({
        type: UPLOAD_ERRORS.TOO_MANY_FILES,
        message: `Maximum ${MAX_FILES_PER_UPLOAD} files allowed per upload`
      });
      return errors;
    }

    // Validate each file
    files.forEach((file) => {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push({
          type: UPLOAD_ERRORS.FILE_TOO_LARGE,
          message: `File "${file.name}" is too large. Maximum size is ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`,
          file: file.name
        });
      }

      // Check file type
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_FILE_TYPES[fileExtension]) {
        errors.push({
          type: UPLOAD_ERRORS.INVALID_FILE_TYPE,
          message: `File "${file.name}" has unsupported type. Allowed: ${Object.keys(ALLOWED_FILE_TYPES).join(', ')}`,
          file: file.name
        });
      }
    });

    return errors;
  }, []);

  // Handle file upload with validation and improved error handling
  const handleFileUpload = useCallback(async (files, category, onSuccess) => {
    // Prevent multiple simultaneous uploads
    if (uploading) {
      console.log('Upload already in progress, ignoring...');
      return;
    }

    // Clear previous errors
    setUploadError(null);
    
    // Validate files before upload
    const validationErrors = validateFiles(files);
    if (validationErrors.length > 0) {
      const errorMessage = validationErrors.map(err => err.message).join('; ');
      setUploadError({
        type: validationErrors[0].type,
        message: errorMessage,
        details: validationErrors
      });
      console.error('File validation failed:', validationErrors);
      return;
    }

    setUploading(true);
    
    try {
      console.log(`📤 Uploading ${files.length} files to ${category} (PostgreSQL storage)...`);
      
      // Upload files using API service - files will be processed and stored in PostgreSQL
      // with automatic AI analysis for key themes and thought questions
      const result = await apiService.uploadFiles(files, category);
      
      console.log(`✅ Upload complete: ${result.uploaded_count} files uploaded to database`);
      
      // Call success callback if provided
      if (onSuccess) {
        await onSuccess(category);
      }
      
      setShowUploadModal(false);
      setUploadError(null); // Clear any previous errors on success
    } catch (error) {
      console.error('Upload failed:', error);
      
      // Set specific error based on error type
      let errorType = UPLOAD_ERRORS.UPLOAD_FAILED;
      let errorMessage = 'Upload failed. Please try again.';
      
      if (error.message.includes('Network')) {
        errorType = UPLOAD_ERRORS.NETWORK_ERROR;
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message.includes('413') || error.message.includes('too large')) {
        errorType = UPLOAD_ERRORS.FILE_TOO_LARGE;
        errorMessage = 'One or more files are too large. Please reduce file size and try again.';
      }
      
      setUploadError({
        type: errorType,
        message: errorMessage,
        originalError: error.message
      });
      
      throw error; // Re-throw to let parent handle the error if needed
    } finally {
      // Always reset uploading state
      setUploading(false);
      
      // Force re-render of drag handlers
      setTimeout(() => {
        console.log('🔄 Upload state reset, ready for next upload');
      }, 100);
    }
  }, [uploading, validateFiles]);

  // Handle file selection from input
  const handleFileSelect = useCallback((event, category, onSuccess) => {
    const files = Array.from(event.target.files);
    if (files.length > 0) {
      handleFileUpload(files, category, onSuccess);
    }
  }, [handleFileUpload]);

  // Handle drag over
  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  // Handle file drop
  const handleDrop = useCallback((event, category, onSuccess) => {
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
  }, [uploading, handleFileUpload]);

  // Trigger file input click
  const triggerFileSelect = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // Clear file input
  const clearFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Get file input props (to be used by component) - aligned with storage architecture
  const getFileInputProps = useCallback((category, onSuccess) => {
    return {
      ref: fileInputRef,
      type: 'file',
      multiple: true,
      accept: Object.keys(ALLOWED_FILE_TYPES).join(','), // Dynamic accept based on allowed types
      onChange: (e) => handleFileSelect(e, category, onSuccess),
      style: { display: 'none' }
    };
  }, [handleFileSelect]);

  return {
    // State
    uploading,
    uploadError,
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
    setUploadError, // Allow parent components to clear errors

    // Utilities
    getFileInputProps,
    validateFiles, // Expose validation for external use
    
    // Constants for external use
    ALLOWED_FILE_TYPES,
    MAX_FILE_SIZE,
    MAX_FILES_PER_UPLOAD,
    UPLOAD_ERRORS
  };
};