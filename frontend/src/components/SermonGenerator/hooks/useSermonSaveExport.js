import { useState } from 'react';
import { apiService } from '../../../services/api';

export const useSermonSaveExport = () => {
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  // Handle export in various formats
  const handleExport = (format, content, title = 'Sermon') => {
    try {
      let exportContent = content;
      let filename = `${title || 'Sermon'}.${format}`;
      let mimeType = 'text/plain';

      switch (format) {
        case 'md':
          mimeType = 'text/markdown';
          break;
        case 'txt':
          // Convert markdown to plain text
          exportContent = content
            .replace(/#{1,6}\s*/g, '') // Remove headers
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
            .replace(/\*(.*?)\*/g, '$1') // Remove italic
            .replace(/`(.*?)`/g, '$1') // Remove code
            .replace(/\[(.*?)\]\(.*?\)/g, '$1'); // Remove links
          mimeType = 'text/plain';
          break;
        case 'docx':
          // For now, export as text with .docx extension
          // In future, could integrate with docx library
          exportContent = content
            .replace(/#{1,6}\s*/g, '') // Remove headers
            .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
            .replace(/\*(.*?)\*/g, '$1') // Remove italic
            .replace(/`(.*?)`/g, '$1') // Remove code
            .replace(/\[(.*?)\]\(.*?\)/g, '$1'); // Remove links
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        default:
          format = 'md';
          mimeType = 'text/markdown';
      }

      // Create and download file
      const blob = new Blob([exportContent], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setShowExportDropdown(false);
      console.log(`✅ Exported as ${format.toUpperCase()}: ${filename}`);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  };

  // Handle save to library
  const handleSave = () => {
    setShowSaveModal(true);
  };

  // Handle actual save to backend
  const handleConfirmSave = async (content, title, prompt) => {
    if (!content.trim()) {
      alert('No content to save.');
      return;
    }

    setIsSaving(true);
    
    try {
      // Create the content object
      const sermonData = {
        title: title || 'Untitled Sermon',
        content: content,
        prompt: prompt, // Store the original input for future editing
        category: 'sermons',
        filename: `${title || 'Untitled Sermon'}.md`
      };

      console.log('💾 Saving sermon:', sermonData.title);

      // Create file blob and upload
      const blob = new Blob([content], { type: 'text/markdown' });
      const file = new File([blob], sermonData.filename, { type: 'text/markdown' });
      
      // Use the upload API
      const result = await apiService.uploadFiles([file], 'sermons');
      
      if (result.uploaded_count > 0) {
        setSaveSuccess(true);
        setShowSaveModal(false);
        
        console.log('✅ Sermon saved successfully to library');
        
        // Show success message briefly
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        throw new Error('Upload failed - no files were uploaded');
      }
    } catch (error) {
      console.error('Save failed:', error);
      alert(`Failed to save sermon: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Cancel save modal
  const handleCancelSave = () => {
    setShowSaveModal(false);
  };

  // Toggle export dropdown
  const toggleExportDropdown = () => {
    setShowExportDropdown(!showExportDropdown);
  };

  return {
    // State
    showExportDropdown,
    isSaving,
    saveSuccess,
    showSaveModal,

    // Actions
    handleExport,
    handleSave,
    handleConfirmSave,
    handleCancelSave,
    toggleExportDropdown,

    // Setters
    setShowExportDropdown,
    setShowSaveModal
  };
};