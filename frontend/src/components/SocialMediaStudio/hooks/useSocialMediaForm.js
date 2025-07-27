import { useState } from 'react';

export const useSocialMediaForm = () => {
  // Form inputs
  const [inputContent, setInputContent] = useState('');
  const [contentTitle, setContentTitle] = useState('');
  const [editableContent, setEditableContent] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  
  // Form configuration
  const [selectedPlatform, setSelectedPlatform] = useState('Facebook');
  const [selectedFormat, setSelectedFormat] = useState('Post');
  const [contentType, setContentType] = useState('Quote');
  const [postLength, setPostLength] = useState('Short');
  const [exportFormat, setExportFormat] = useState('Copy Text');
  
  // UI states
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Platform options
  const platforms = ['Facebook', 'Twitter/X', 'Instagram', 'LinkedIn'];
  const formats = ['Post', 'Story', 'Thread', 'Carousel'];
  const contentTypes = ['Quote', 'Educational', 'Community', 'Announcement'];
  const postLengths = ['Short', 'Medium', 'Long', 'Thread'];
  const exportFormats = ['Copy Text', 'Schedule Post', 'Save Draft', 'Download Image'];
  
  // Handle platform selection
  const handlePlatformSelect = (platform) => {
    setSelectedPlatform(platform);
    console.log(`📱 Selected platform: ${platform}`);
  };
  
  // Handle format selection
  const handleFormatSelect = (format) => {
    setSelectedFormat(format);
    console.log(`📝 Selected format: ${format}`);
  };
  
  // Handle content type change
  const handleContentTypeChange = (type) => {
    setContentType(type);
    console.log(`📋 Selected content type: ${type}`);
  };
  
  // Handle post length change
  const handlePostLengthChange = (length) => {
    setPostLength(length);
    console.log(`📏 Selected post length: ${length}`);
  };
  
  // Handle export format change
  const handleExportFormatChange = (format) => {
    setExportFormat(format);
    console.log(`💾 Selected export format: ${format}`);
  };
  
  // Toggle preview mode
  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode);
  };
  
  // Clear all form data
  const handleClear = () => {
    const hasContent = inputContent.trim() || generatedContent.trim() || contentTitle.trim() || editableContent.trim();
    
    if (hasContent) {
      const userConfirmed = window.confirm('Have you saved any changes? This will clear all content and cannot be undone. Are you sure you want to continue?');
      
      if (!userConfirmed) {
        return false; // User cancelled
      }
    }
    
    // Clear all form state
    setInputContent('');
    setGeneratedContent('');
    setContentTitle('');
    setEditableContent('');
    setError('');
    setIsPreviewMode(false);
    
    console.log('🧹 Cleared all social media form data');
    return true; // Success
  };
  
  // Handle content generation (placeholder for future functionality)
  const handleGenerate = async () => {
    if (!inputContent.trim()) {
      setError('Please add some content to generate social media posts');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Future: Implement AI generation
      console.log('🔄 Generating social media content...');
      console.log('Platform:', selectedPlatform);
      console.log('Format:', selectedFormat);
      console.log('Content Type:', contentType);
      console.log('Post Length:', postLength);
      console.log('Input:', inputContent);
      
      // Placeholder - this will be implemented later
      setGeneratedContent('Generated content will appear here once AI integration is implemented.');
      setEditableContent('Generated content will appear here once AI integration is implemented.');
      
    } catch (error) {
      console.error('Generation failed:', error);
      setError('Failed to generate content. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return {
    // Form inputs
    inputContent,
    setInputContent,
    contentTitle,
    setContentTitle,
    editableContent,
    setEditableContent,
    generatedContent,
    setGeneratedContent,
    
    // Configuration
    selectedPlatform,
    selectedFormat,
    contentType,
    postLength,
    exportFormat,
    
    // Options
    platforms,
    formats,
    contentTypes,
    postLengths,
    exportFormats,
    
    // UI states
    isPreviewMode,
    isLoading,
    error,
    
    // Handlers
    handlePlatformSelect,
    handleFormatSelect,
    handleContentTypeChange,
    handlePostLengthChange,
    handleExportFormatChange,
    togglePreviewMode,
    handleClear,
    handleGenerate,
    
    // Setters for external control
    setIsLoading,
    setError
  };
};