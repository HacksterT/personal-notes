import { useEffect } from 'react';

export const useSocialMediaSession = ({
  inputContent,
  setInputContent,
  generatedContent,
  setGeneratedContent,
  contentTitle,
  setContentTitle,
  editableContent,
  setEditableContent
}) => {
  // Session storage keys
  const SESSION_KEYS = {
    inputContent: 'socialMedia_inputContent',
    generatedContent: 'socialMedia_generatedContent',
    contentTitle: 'socialMedia_contentTitle',
    editableContent: 'socialMedia_editableContent'
  };
  
  // Load transferred content from LibraryStacks or other sources
  const loadTransferredContent = () => {
    try {
      const transferredContent = localStorage.getItem('socialMediaContent');
      if (transferredContent) {
        const content = JSON.parse(transferredContent);
        console.log('📱 Loading transferred content:', content);
        
        if (content.content) {
          setInputContent(content.content);
        }
        if (content.title) {
          setContentTitle(content.title);
        }
        
        // Clear the transferred content from localStorage after loading
        localStorage.removeItem('socialMediaContent');
        return true; // Content was loaded
      }
    } catch (error) {
      console.error('Failed to load transferred content:', error);
    }
    return false; // No content was loaded
  };
  
  // Load session data from localStorage
  const loadSessionData = () => {
    try {
      const savedInputContent = localStorage.getItem(SESSION_KEYS.inputContent);
      const savedGeneratedContent = localStorage.getItem(SESSION_KEYS.generatedContent);
      const savedContentTitle = localStorage.getItem(SESSION_KEYS.contentTitle);
      const savedEditableContent = localStorage.getItem(SESSION_KEYS.editableContent);
      
      if (savedInputContent) {
        setInputContent(savedInputContent);
        console.log('📝 Loaded input content from session memory');
      }
      
      if (savedGeneratedContent) {
        setGeneratedContent(savedGeneratedContent);
        console.log('📱 Loaded generated content from session memory');
      }
      
      if (savedContentTitle) {
        setContentTitle(savedContentTitle);
        console.log('📋 Loaded content title from session memory');
      }
      
      if (savedEditableContent) {
        setEditableContent(savedEditableContent);
        console.log('✏️ Loaded editable content from session memory');
      }
    } catch (error) {
      console.error('Failed to load session data:', error);
    }
  };
  
  // Clear all session data from localStorage
  const clearSessionData = () => {
    try {
      Object.values(SESSION_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('🧹 Cleared all social media session memory');
    } catch (error) {
      console.error('Failed to clear session data:', error);
    }
  };
  
  // Load data on component mount
  useEffect(() => {
    // First try to load transferred content
    const wasTransferredContentLoaded = loadTransferredContent();
    
    // Only load session data if no transferred content was loaded
    if (!wasTransferredContentLoaded) {
      loadSessionData();
    }
  }, []);
  
  // Save input content to session storage
  useEffect(() => {
    if (inputContent) {
      localStorage.setItem(SESSION_KEYS.inputContent, inputContent);
    }
  }, [inputContent]);
  
  // Save generated content to session storage
  useEffect(() => {
    if (generatedContent) {
      localStorage.setItem(SESSION_KEYS.generatedContent, generatedContent);
    }
  }, [generatedContent]);
  
  // Save content title to session storage
  useEffect(() => {
    if (contentTitle) {
      localStorage.setItem(SESSION_KEYS.contentTitle, contentTitle);
    }
  }, [contentTitle]);
  
  // Save editable content to session storage
  useEffect(() => {
    if (editableContent) {
      localStorage.setItem(SESSION_KEYS.editableContent, editableContent);
    }
  }, [editableContent]);
  
  return {
    loadTransferredContent,
    loadSessionData,
    clearSessionData,
    SESSION_KEYS
  };
};