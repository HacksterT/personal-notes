import { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';

export const useStudyEditor = () => {
  const [studyNotes, setStudyNotes] = useState('');
  const [editorCategory, setEditorCategory] = useState('study-notes');
  const [isNewDocument, setIsNewDocument] = useState(true);
  const [editingContentId, setEditingContentId] = useState(null);
  const [editingContentData, setEditingContentData] = useState(null);
  const [currentTags, setCurrentTags] = useState([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [aiAnalysisInProgress, setAiAnalysisInProgress] = useState(false);

  // Save editor content to localStorage
  const saveEditorContentToStorage = (content, category) => {
    try {
      const editorState = {
        content: content,
        category: category,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('studyHallEditorContent', JSON.stringify(editorState));
    } catch (error) {
      console.error('Failed to save editor content to storage:', error);
    }
  };

  // Load editor content from localStorage
  const loadEditorContentFromStorage = () => {
    try {
      const stored = localStorage.getItem('studyHallEditorContent');
      if (stored) {
        const editorState = JSON.parse(stored);
        // Only load if we have stored content and we're not editing existing content
        if (editorState.content && !editingContentId) {
          setStudyNotes(editorState.content);
          setEditorCategory(editorState.category || 'study-notes');
          console.log('📝 Restored editor content from previous session');
        }
      }
    } catch (error) {
      console.error('Failed to load editor content from storage:', error);
    }
  };

  // Extract title from first line of content
  const extractTitle = (content) => {
    const lines = content.trim().split('\n');
    const firstLine = lines[0] || '';
    // Remove "Title:" prefix if present
    return firstLine.replace(/^Title:\s*/i, '').trim() || 'Untitled';
  };

  // Check if content has been modified
  const hasUnsavedChanges = () => {
    return studyNotes.trim().length > 0 && !saveSuccess;
  };

  // Handle New Note button
  const handleNewNote = () => {
    if (hasUnsavedChanges()) {
      setShowNewNoteModal(true);
    } else {
      // No unsaved changes, create new note directly
      createNewNote();
    }
  };

  // Create new note (clear editor)
  const createNewNote = () => {
    setStudyNotes('');
    setIsNewDocument(true);
    setEditingContentId(null);
    setEditingContentData(null);
    setCurrentTags([]);
    setSaveSuccess(false);
    setShowNewNoteModal(false);
  };

  // Handle tag changes
  const handleTagsChange = async (contentId, tags) => {
    try {
      await apiService.updateContentTags(contentId, tags);
      setCurrentTags(tags);
      console.log('✅ Tags updated successfully:', tags);
    } catch (error) {
      console.error('Failed to update tags:', error);
      throw error;
    }
  };

  // Handle Yes (save first) in New Note modal
  const handleSaveBeforeNew = () => {
    setShowNewNoteModal(false);
    setShowSaveModal(true);
  };

  // Handle No (don't save) in New Note modal
  const handleDontSaveNew = () => {
    createNewNote();
  };

  // Poll for AI analysis results after saving (with 10-minute timeout)
  const pollForAiAnalysis = async (contentId = null, startTime = Date.now()) => {
    const targetId = contentId || editingContentId;
    if (!targetId) {
      console.log('❌ Polling stopped - no content ID available:', { contentId, editingContentId });
      return;
    }
    
    // Check if 400 seconds have passed (400,000 ms)
    const elapsed = Date.now() - startTime;
    if (elapsed > 400000) {
      console.log('⏰ AI analysis polling timeout after 400 seconds');
      setAiAnalysisInProgress(false);
      return;
    }
    
    try {
      console.log('🔄 Polling GET request for content:', targetId);
      const updatedContent = await apiService.getContent(targetId);
      console.log('📦 Polling response:', {
        processing_status: updatedContent.processing_status,
        has_themes: !!updatedContent.key_themes,
        themes_count: updatedContent.key_themes?.length || 0
      });
      
      if (updatedContent.processing_status === 'completed') {
        console.log('✅ AI analysis completed after save:', {
          themes: updatedContent.key_themes?.length || 0,
          questions: updatedContent.thought_questions?.length || 0
        });
        setEditingContentData(updatedContent);  // Always update like the working edit workflow
        setAiAnalysisInProgress(false);
      } else if (updatedContent.processing_status === 'failed') {
        console.log('❌ AI analysis failed after save');
        setAiAnalysisInProgress(false);
      } else if (updatedContent.processing_status === 'pending') {
        // Continue polling only if still pending
        setTimeout(() => pollForAiAnalysis(targetId, startTime), 3000);
      } else {
        // Unknown status - stop polling
        console.log('🔍 Unknown processing status:', updatedContent.processing_status);
        setAiAnalysisInProgress(false);
      }
    } catch (pollErr) {
      console.error('Polling error after save:', pollErr);
      setAiAnalysisInProgress(false);
    }
  };

  // Handle Save button
  const handleSave = () => {
    if (studyNotes.trim().length === 0) {
      alert('Please add some content before saving.');
      return;
    }
    setShowSaveModal(true);
  };

  // Handle actual save to backend
  const handleConfirmSave = async () => {
    setIsSaving(true);
    
    try {
      const title = extractTitle(studyNotes);
      console.log('🔧 Starting save process...');
      console.log('📝 Title:', title);
      console.log('📁 Category:', editorCategory);
      console.log('📊 Content length:', studyNotes.length);
      console.log('🆔 Editing content ID:', editingContentId);
      console.log('📄 Is new document:', isNewDocument);
      console.log('💾 Editing content data:', editingContentData ? editingContentData.title : 'null');
      
      if (editingContentId) {
        // Update existing content
        console.log('🔄 UPDATING existing content with ID:', editingContentId);
        const contentData = {
          title: title,
          content: studyNotes,
          category: editorCategory,
          filename: `${title}.txt`,
          tags: currentTags
        };
        
        console.log('📦 Update payload:', contentData);
        await apiService.updateContent(editingContentId, contentData);
        console.log('✅ Update successful for ID:', editingContentId);
        
        // After updating existing content, check if we need to start polling for AI analysis
        if (studyNotes.trim().length > 100) {
          try {
            const fullContentData = await apiService.getContent(editingContentId);
            setEditingContentData(fullContentData);
            console.log('✅ Complete content data loaded after update:', fullContentData.title, {
              key_themes: fullContentData.key_themes?.length || 0,
              thought_questions: fullContentData.thought_questions?.length || 0,
              processing_status: fullContentData.processing_status
            });
            
            // Check if analysis is still in progress (exactly like upload workflow)
            if (!fullContentData.key_themes || fullContentData.key_themes.length === 0) {
              console.log('🤖 AI analysis in progress after update, starting polling...');
              setAiAnalysisInProgress(true);
              
              // Polling function with closure (exactly like upload workflow)
              const pollForAnalysis = async (startTime = Date.now()) => {
                // Check if 400 seconds have passed (400,000 ms)
                const elapsed = Date.now() - startTime;
                if (elapsed > 400000) {
                  console.log('⏰ AI analysis polling timeout after 400 seconds');
                  setAiAnalysisInProgress(false);
                  return;
                }
                
                try {
                  const updatedContent = await apiService.getContent(editingContentId);
                  if (updatedContent.processing_status === 'completed' && updatedContent.key_themes && updatedContent.key_themes.length > 0) {
                    console.log('✅ AI analysis completed after update:', {
                      themes: updatedContent.key_themes?.length || 0,
                      questions: updatedContent.thought_questions?.length || 0
                    });
                    setEditingContentData(updatedContent);
                    setAiAnalysisInProgress(false);
                  } else if (updatedContent.processing_status === 'failed') {
                    console.log('❌ AI analysis failed after update');
                    setAiAnalysisInProgress(false);
                  } else if (updatedContent.processing_status === 'pending') {
                    // Continue polling only if still pending
                    setTimeout(() => pollForAnalysis(startTime), 3000);
                  } else {
                    // Unknown status - stop polling
                    console.log('🔍 Unknown processing status after update:', updatedContent.processing_status);
                    setAiAnalysisInProgress(false);
                  }
                } catch (pollErr) {
                  console.error('Polling error after update:', pollErr);
                  setAiAnalysisInProgress(false);
                }
              };
              
              // Start polling after 2 seconds (exactly like upload workflow)
              setTimeout(pollForAnalysis, 2000);
            } else {
              console.log('✅ Analysis already complete after update!');
              setAiAnalysisInProgress(false);
            }
          } catch (error) {
            console.error('Failed to fetch complete content data after update:', error);
          }
        }
      } else {
        // Create new content
        console.log('➕ CREATING new content (no editingContentId found)...');
        const content = studyNotes;
        const blob = new Blob([content], { type: 'text/plain' });
        const file = new File([blob], `${title}.txt`, { type: 'text/plain' });
        
        console.log('File created:', file.name, file.size);
        
        // Use existing upload API
        const formData = new FormData();
        formData.append('files', file);
        formData.append('category', editorCategory);
        
        console.log('FormData created, making request...');
        
        const response = await fetch(`${apiService.baseURL}/api/storage/upload`, {
          method: 'POST',
          body: formData
        });
        
        console.log('Response received:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Response error:', errorText);
          throw new Error(`Save failed: ${response.status} ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Save successful:', result);
        
        // Handle polling for both new and existing documents (like upload workflow)
        // Extract content ID from response (could be result.content_id or result.items[0].id)
        const responseContentId = result.content_id || (result.items && result.items[0] ? result.items[0].id : null);
        const targetContentId = responseContentId || editingContentId;
        
        if (targetContentId) {
          // Update content ID if this was a new document
          if (responseContentId && !editingContentId) {
            setEditingContentId(responseContentId);
            // Update tags for new content if any tags are set
            if (currentTags.length > 0) {
              try {
                await apiService.updateContentTags(responseContentId, currentTags);
                console.log('✅ Tags updated for new content:', currentTags);
              } catch (tagError) {
                console.error('Failed to update tags for new content:', tagError);
              }
            }
          }
          
          // Fetch content immediately and check analysis status (exactly like upload workflow)
          try {
            const fullContentData = await apiService.getContent(targetContentId);
            setEditingContentData(fullContentData);
            console.log('✅ Complete content data loaded after save:', fullContentData.title, {
              key_themes: fullContentData.key_themes?.length || 0,
              thought_questions: fullContentData.thought_questions?.length || 0,
              processing_status: fullContentData.processing_status
            });
            
            // Check if analysis is still in progress (exactly like upload workflow)
            if (!fullContentData.key_themes || fullContentData.key_themes.length === 0) {
              console.log('🤖 AI analysis in progress, starting polling...');
              setAiAnalysisInProgress(true);
              
              // Polling function with closure (exactly like upload workflow)
              const pollForAnalysis = async (startTime = Date.now()) => {
                // Check if 400 seconds have passed (400,000 ms)
                const elapsed = Date.now() - startTime;
                if (elapsed > 400000) {
                  console.log('⏰ AI analysis polling timeout after 400 seconds');
                  setAiAnalysisInProgress(false);
                  return;
                }
                
                try {
                  const updatedContent = await apiService.getContent(targetContentId);
                  if (updatedContent.processing_status === 'completed' && updatedContent.key_themes && updatedContent.key_themes.length > 0) {
                    console.log('✅ AI analysis completed after save:', {
                      themes: updatedContent.key_themes?.length || 0,
                      questions: updatedContent.thought_questions?.length || 0
                    });
                    setEditingContentData(updatedContent);
                    setAiAnalysisInProgress(false);
                  } else if (updatedContent.processing_status === 'failed') {
                    console.log('❌ AI analysis failed after save');
                    setAiAnalysisInProgress(false);
                  } else if (updatedContent.processing_status === 'pending') {
                    // Continue polling only if still pending
                    setTimeout(() => pollForAnalysis(startTime), 3000);
                  } else {
                    // Unknown status - stop polling
                    console.log('🔍 Unknown processing status:', updatedContent.processing_status);
                    setAiAnalysisInProgress(false);
                  }
                } catch (pollErr) {
                  console.error('Polling error after save:', pollErr);
                  setAiAnalysisInProgress(false);
                }
              };
              
              // Start polling after 2 seconds (exactly like upload workflow)
              setTimeout(pollForAnalysis, 2000);
            } else {
              console.log('✅ Analysis already complete!');
              setAiAnalysisInProgress(false);
            }
          } catch (error) {
            console.error('Failed to fetch complete content data after save:', error);
          }
        }
      }
      
      // Success!
      setSaveSuccess(true);
      setShowSaveModal(false);
      setIsNewDocument(false);
      
      // Clear editing session since content was successfully saved
      if (editingContentId) {
        localStorage.removeItem('editingSession');
      }
      
      // Show AI analysis loading state for substantial content (if not already handled above)
      if (studyNotes.trim().length > 100 && !aiAnalysisInProgress) {
        setAiAnalysisInProgress(true);
      }
      
      // Show success message briefly
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (error) {
      console.error('Save failed:', error);
      alert(`Failed to save. Error: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle content change
  const handleContentChange = (newContent) => {
    setStudyNotes(newContent);
    if (isNewDocument && newContent.length > 0) {
      setIsNewDocument(false);
    }
    // Auto-save to localStorage (debounced)
    if (!editingContentId) {
      saveEditorContentToStorage(newContent, editorCategory);
    } else {
      // For editing content, save to a separate editing session key
      const editingSessionData = {
        id: editingContentId,
        content: newContent,
        category: editorCategory,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('editingSession', JSON.stringify(editingSessionData));
    }
  };

  // Handle category change
  const handleCategoryChange = (newCategory) => {
    console.log('📁 Category changed from', editorCategory, 'to', newCategory);
    setEditorCategory(newCategory);
    // Save category change to localStorage
    if (!editingContentId) {
      saveEditorContentToStorage(studyNotes, newCategory);
    }
  };

  // Check for editing content from LibraryStacks
  useEffect(() => {
    const checkForEditingContent = async () => {
      try {
        const editingContent = localStorage.getItem('editingContent');
        if (editingContent) {
          const content = JSON.parse(editingContent);
          console.log('📝 Loading content for editing:', content.title);
          console.log('🆔 Setting editingContentId to:', content.id);
          console.log('📁 Setting category to:', content.category);
          console.log('📊 Content length:', (content.content || '').length);
          
          // Set the editor content and category from localStorage
          setStudyNotes(content.content || '');
          setEditorCategory(content.category || 'study-notes');
          setIsNewDocument(false);
          setEditingContentId(content.id);
          
          // Clear any session persistence since we're editing existing content
          localStorage.removeItem('studyHallEditorContent');
          
          // Fetch the complete content data from API to get AI analysis
          try {
            console.log('🔄 Fetching complete content data from API...');
            const fullContentData = await apiService.getContent(content.id);
            setEditingContentData(fullContentData);
            setCurrentTags(fullContentData.tags || []);
            console.log('✅ Complete content data loaded:', fullContentData.title, {
              key_themes: fullContentData.key_themes?.length || 0,
              thought_questions: fullContentData.thought_questions?.length || 0,
              tags: fullContentData.tags?.length || 0
            });
            
            // Check for unsaved editing session
            const editingSession = localStorage.getItem('editingSession');
            if (editingSession) {
              const sessionData = JSON.parse(editingSession);
              if (sessionData.id === content.id) {
                console.log('🔄 Found unsaved editing session, restoring content...');
                setStudyNotes(sessionData.content);
                setEditorCategory(sessionData.category);
              }
            }
          } catch (apiError) {
            console.error('Failed to fetch complete content data:', apiError);
            // Fallback to localStorage data
            setEditingContentData(content);
          }
          
          // Clear the editing content from localStorage
          localStorage.removeItem('editingContent');
        }
      } catch (error) {
        console.error('Failed to load editing content:', error);
      }
    };

    checkForEditingContent();
    
    // Load previous editor content with a delay to avoid conflicts
    setTimeout(() => {
      const editingContent = localStorage.getItem('editingContent');
      if (!editingContent) { // Only load if not editing existing content
        loadEditorContentFromStorage();
      }
    }, 100);
  }, []); // Run only once when component mounts

  return {
    // State
    studyNotes,
    editorCategory,
    isNewDocument,
    editingContentId,
    editingContentData,
    currentTags,
    showSaveModal,
    showNewNoteModal,
    isSaving,
    saveSuccess,
    aiAnalysisInProgress,

    // Actions
    handleNewNote,
    handleSave,
    handleConfirmSave,
    handleTagsChange,
    handleSaveBeforeNew,
    handleDontSaveNew,
    handleContentChange,
    handleCategoryChange,
    extractTitle,
    hasUnsavedChanges,

    // Setters for modal control
    setShowSaveModal,
    setShowNewNoteModal
  };
};