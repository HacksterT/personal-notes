import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  BookOpen, 
  MessageCircle, 
  Plus,
  Save,
  Loader2,
  FileText,
  Filter,
  ArrowDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

// Import our Bible service, API service, and navigation
import { bibleService } from '../../services/bibleService';
import { apiService } from '../../services/api';
import NavigationMenu from './NavigationMenu';

const StudyHall = () => {
  const navigate = useNavigate();
  const [selectedPassage, setSelectedPassage] = useState('John 3:16-21');
  const [studyNotes, setStudyNotes] = useState('');
  const [editorCategory, setEditorCategory] = useState('study-notes');
  const [isNewDocument, setIsNewDocument] = useState(true);
  const [editingContentId, setEditingContentId] = useState(null);
  const [editingContentData, setEditingContentData] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showNewNoteModal, setShowNewNoteModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [aiAnalysisInProgress, setAiAnalysisInProgress] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  
  // Chat state management
  const [chatHistory, setChatHistory] = useState([]);
  const [isLibrarianTyping, setIsLibrarianTyping] = useState(false);
  const [chatError, setChatError] = useState('');
  
  // Bible data state
  const [bibleVerses, setBibleVerses] = useState([]);
  const [currentVersion, setCurrentVersion] = useState('kjv');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Resource injection state
  const [availableResources, setAvailableResources] = useState([]);
  const [selectedResources, setSelectedResources] = useState([]);
  const [resourceFilter, setResourceFilter] = useState('all');
  const [viewingResourceIndex, setViewingResourceIndex] = useState(null);

  // Bible panel accordion state
  const [isBiblePanelCollapsed, setIsBiblePanelCollapsed] = useState(false);

  // Load John 3 by default when component mounts
  useEffect(() => {
    loadDefaultPassage();
    loadAvailableResources();
    loadActiveResourcesFromStorage();
  }, [currentVersion]);

  // Auto-scroll chat to bottom when messages change
  useEffect(() => {
    const chatElement = document.getElementById('chat-history');
    if (chatElement) {
      chatElement.scrollTop = chatElement.scrollHeight;
    }
  }, [chatHistory, isLibrarianTyping]);

  // Load active resources from localStorage and fetch their themes
  const loadActiveResourcesFromStorage = async () => {
    try {
      const stored = localStorage.getItem('activeResources');
      if (stored) {
        const resources = JSON.parse(stored);
        
        // For each resource, fetch its complete data including themes
        const enrichedResources = await Promise.all(
          resources.map(async (resource) => {
            try {
              const fullData = await apiService.getContent(resource.id);
              return {
                ...resource,
                key_themes: fullData.key_themes || []
              };
            } catch (error) {
              console.error(`Failed to fetch themes for ${resource.title}:`, error);
              return resource; // Return original if fetch fails
            }
          })
        );
        
        setSelectedResources(enrichedResources);
        console.log(`📋 Loaded ${enrichedResources.length} active resources from storage with themes:`, 
          enrichedResources.map(r => ({ title: r.title, themes: r.key_themes?.length || 0 })));
      }
    } catch (error) {
      console.error('Failed to load active resources from storage:', error);
    }
  };

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

  // Reload resources when filter changes to get fresh data
  useEffect(() => {
    if (resourceFilter !== 'all') {
      loadAvailableResources();
    }
  }, [resourceFilter]);

  const loadDefaultPassage = async () => {
    setLoading(true);
    setError('');
    
    try {
      console.log('📖 Loading John chapter 3...');
      const chapterData = await bibleService.getChapter('John', 3, currentVersion);
      
      // Take first 6 verses for the demo
      const displayVerses = chapterData.verses.slice(0, 6).map(v => ({
        reference: v.reference,
        version: chapterData.version,
        text: v.text
      }));
      
      setBibleVerses(displayVerses);
      console.log('✅ Loaded verses:', displayVerses.length);
    } catch (err) {
      console.error('❌ Failed to load default passage:', err);
      setError('Failed to load Bible passage. Please check that en_kjv.json is in public/bibles/');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableResources = async () => {
    try {
      console.log('📚 Loading available resources from library...');
      
      const categories = ['sermons', 'study-notes', 'research', 'journal', 'bookmarks'];
      let allResources = [];
      
      // Load recent resources from each category
      for (const category of categories) {
        try {
          const response = await apiService.listContent(category, 10, 0); // Last 10 per category
          const items = response.items || [];
          
          // Format items for the resource selector
          const formattedItems = items.map(item => ({
            id: item.id,
            title: item.title,
            category: category,
            type: category,
            size: item.size_bytes ? formatFileSize(item.size_bytes) : '0 B',
            content: item.content, // Include content for viewing
            key_themes: item.key_themes || [], // Include key themes for sermon curation
            date_created: item.date_created,
            date_modified: item.date_modified
          }));
          
          allResources = [...allResources, ...formattedItems];
        } catch (err) {
          console.error(`Failed to load ${category} resources:`, err);
        }
      }
      
      // Sort by most recent first
      allResources.sort((a, b) => new Date(b.date_modified || b.date_created) - new Date(a.date_modified || a.date_created));
      
      setAvailableResources(allResources);
      console.log(`✅ Loaded ${allResources.length} resources from library`);
    } catch (err) {
      console.error('❌ Failed to load resources:', err);
      setAvailableResources([]);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleBibleSearch = async (query) => {
    if (!query.trim()) {
      loadDefaultPassage();
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      console.log('🔍 Searching for:', query);
      const results = await bibleService.searchText(query, currentVersion, 10);
      
      setBibleVerses(results);
      console.log('✅ Found verses:', results.length);
      
      if (results.length === 0) {
        setError(`No verses found containing "${query}"`);
      }
    } catch (err) {
      console.error('❌ Search failed:', err);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    handleBibleSearch(searchQuery);
  };

  const mockChatMessages = [
    {
      type: 'ai',
      content: 'Study Librarian ready to assist...'
    }
  ];


  const handleChatSubmit = async (e) => {
    e.preventDefault();
    
    if (!chatMessage.trim()) return;
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: chatMessage,
      timestamp: new Date()
    };
    
    // Add user message to chat history
    setChatHistory(prev => [...prev, userMessage]);
    const currentMessage = chatMessage;
    setChatMessage('');
    setChatError('');
    
    // Show typing indicator
    setIsLibrarianTyping(true);
    
    try {
      // Build conversation history for API (limit to last 4 messages - 2 user/assistant pairs)
      const allConversationHistory = chatHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content,
        timestamp: msg.timestamp
      }));
      const conversationHistory = allConversationHistory.slice(-4); // Last 4 messages only
      
      // Build study context
      const studyContext = {
        current_passage: selectedPassage,
        study_notes: studyNotes.substring(0, 1000), // First 1000 chars for context
        active_resources: selectedResources.map(resource => ({
          title: resource.title,
          category: resource.category,
          key_themes: resource.key_themes || []
        }))
      };
      
      // Call backend API
      const response = await fetch('/api/chat/librarian', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          conversation_history: conversationHistory,
          context: studyContext
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `API Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.response) {
        const librarianMessage = {
          id: Date.now() + 1,
          type: 'librarian',
          content: data.response,
          timestamp: new Date()
        };
        
        setChatHistory(prev => [...prev, librarianMessage]);
      } else {
        throw new Error(data.error || 'Failed to get response from librarian');
      }
      
    } catch (error) {
      console.error('Chat error:', error);
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        type: 'librarian',
        content: `I apologize, but I'm having trouble responding right now. ${error.message.includes('Failed to fetch') ? 'Please check your connection and try again.' : 'Please try again in a moment.'}`,
        timestamp: new Date()
      };
      
      setChatHistory(prev => [...prev, errorMessage]);
      setChatError(error.message);
    } finally {
      setIsLibrarianTyping(false);
    }
  };

  const addVerseToNotes = (verse) => {
    const verseText = `\n\n**${verse.reference} (${verse.version})**\n"${verse.text}"\n`;
    setStudyNotes(prev => prev + verseText);
  };

  // Insert text at cursor position in the study notes editor
  const insertTextAtCursor = (textToInsert) => {
    const textarea = document.getElementById('study-notes-editor');
    if (textarea) {
      const startPos = textarea.selectionStart;
      const endPos = textarea.selectionEnd;
      const currentText = studyNotes;
      
      const newText = currentText.substring(0, startPos) + 
                     `\n\n--- Librarian Response ---\n${textToInsert}\n\n` + 
                     currentText.substring(endPos);
      
      setStudyNotes(newText);
      
      // Set cursor position after inserted text
      setTimeout(() => {
        const newCursorPos = startPos + textToInsert.length + 35; // Account for added formatting
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }, 10);
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
    setSaveSuccess(false);
    setShowNewNoteModal(false);
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
          filename: `${title}.txt`
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
        
        const response = await fetch('/api/storage/upload', {
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

  // Handle curating content for sermon
  const handleCurateForSermon = () => {
    // Gather main content from editor
    const mainContent = studyNotes.trim();
    
    if (!mainContent) {
      alert('Please add some content to your study notes before curating for sermon.');
      return;
    }
    
    // Gather key themes from active resources
    const activeResourceThemes = selectedResources.map(resource => {
      console.log('🔍 Processing resource:', resource.title, 'Key themes:', resource.key_themes);
      return {
        title: resource.title,
        category: resource.category,
        themes: resource.key_themes || [] // This would come from the resource data
      };
    }).filter(resource => resource.themes.length > 0);
    
    console.log('📊 Active resource themes to send:', activeResourceThemes);
    
    // Create curated content structure
    const curatedContent = {
      mainContent: mainContent,
      activeResourceThemes: activeResourceThemes,
      timestamp: new Date().toISOString(),
      sourceDocument: editingContentData?.title || 'Current Study Session'
    };
    
    // Store in localStorage for SermonGenerator to pick up
    localStorage.setItem('curatedSermonContent', JSON.stringify(curatedContent));
    
    // Navigate to sermon workshop
    navigate('/workshop');
  };

  const handleResourceSelect = (resource) => {
    let newResources;
    if (selectedResources.find(r => r.id === resource.id)) {
      newResources = selectedResources.filter(r => r.id !== resource.id);
    } else if (selectedResources.length < 5) {
      newResources = [...selectedResources, resource];
    } else {
      return; // Don't add if already at max
    }
    
    setSelectedResources(newResources);
    // Sync with localStorage
    localStorage.setItem('activeResources', JSON.stringify(newResources));
    console.log('🔄 Updated active resources:', newResources.map(r => ({ title: r.title, key_themes: r.key_themes })));
  };

  const filteredResources = availableResources.filter(resource => {
    if (resourceFilter === 'all') return true;
    return resource.category === resourceFilter;
  });

  // Handle Bible panel toggle
  const handleBiblePanelToggle = () => {
    setIsBiblePanelCollapsed(!isBiblePanelCollapsed);
  };

  // Chat Message Components
  const LibrarianMessage = ({ message }) => (
    <div className="bg-brass/10 p-3 rounded-lg border border-brass/30 mb-3 group">
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 bg-brass rounded-full flex items-center justify-center text-library-dark text-xs font-bold flex-shrink-0">
          L
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="text-brass text-sm font-medium mb-1">Study Librarian</div>
            <button
              onClick={() => insertTextAtCursor(message.content)}
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 hover:bg-brass/20 rounded text-brass hover:text-brass-light"
              title="Insert into study notes at cursor position"
            >
              <ArrowDown size={14} />
            </button>
          </div>
          <div className="text-cream text-sm leading-relaxed">
            {message.content}
          </div>
          <div className="text-brass-light text-xs mt-2 opacity-70">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );

  const UserMessage = ({ message }) => (
    <div className="bg-library-brown/30 p-3 rounded-lg border border-brass/20 mb-3 ml-8">
      <div className="text-cream text-sm leading-relaxed">
        {message.content}
      </div>
      <div className="text-brass-light text-xs mt-2 opacity-70 text-right">
        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </div>
    </div>
  );

  const TypingIndicator = () => (
    <div className="bg-brass/10 p-3 rounded-lg border border-brass/30 mb-3">
      <div className="flex items-start gap-2">
        <div className="w-6 h-6 bg-brass rounded-full flex items-center justify-center text-library-dark text-xs font-bold flex-shrink-0">
          L
        </div>
        <div className="flex-1">
          <div className="text-brass text-sm font-medium mb-1">Study Librarian</div>
          <div className="flex items-center gap-1">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-brass rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-brass rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-2 h-2 bg-brass rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
            <span className="text-brass-light text-xs ml-2">typing...</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-library-gradient">
      {/* Header */}
      <div className="bg-library-dark/90 border-b-2 border-brass px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <NavigationMenu />
          
          <div className="h-6 w-px bg-brass/30" />
          
          <h1 className="text-2xl font-cormorant text-brass">
            📚 Study Hall
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleCurateForSermon}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brass/20 text-brass hover:bg-brass/30 transition-colors duration-300"
            title="Curate Content for Sermon"
          >
            <MessageCircle size={18} />
            <span className="font-cormorant">Curate Content for Sermon</span>
          </button>
        </div>
      </div>

      {/* Main Study Interface */}
      <div 
        className="grid h-[calc(100vh-80px)] transition-all duration-300 ease-in-out"
        style={{
          gridTemplateColumns: isBiblePanelCollapsed 
            ? '40px 1fr 350px' 
            : '300px 1fr 350px'
        }}
      >
        
        {/* Bible Panel - Left Side */}
        <div className="bg-library-brown/20 border-r border-brass/30 flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
          {/* Bible Panel Header with Toggle */}
          <div className={`flex items-center border-b border-brass/30 bg-library-brown/30 transition-all duration-300 ${
            isBiblePanelCollapsed ? 'justify-center p-2' : 'justify-between p-3'
          }`}>
            {!isBiblePanelCollapsed && (
              <h3 className="text-lg font-cormorant text-brass-light">📖 Bible</h3>
            )}
            <button
              onClick={handleBiblePanelToggle}
              className="p-1 rounded hover:bg-brass/20 transition-colors duration-200 text-brass-light hover:text-brass flex-shrink-0"
              title={isBiblePanelCollapsed ? "Expand Bible Panel" : "Collapse Bible Panel"}
            >
              {isBiblePanelCollapsed ? (
                <ChevronRight size={16} />
              ) : (
                <ChevronLeft size={18} />
              )}
            </button>
          </div>

          {/* Collapsed State Content */}
          {isBiblePanelCollapsed ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div 
                className="transform -rotate-90 text-brass-light text-sm font-medium whitespace-nowrap cursor-pointer hover:text-brass transition-colors duration-200"
                onClick={handleBiblePanelToggle}
                title="Expand Bible Panel"
              >
                Bible
              </div>
            </div>
          ) : (
            <>
              {/* Bible Search */}
          <div className="p-4 border-b border-brass/20">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-brass-light" size={18} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Bible passages..."
                  className="library-input w-full pl-10"
                />
              </div>
              <button 
                type="submit" 
                className="btn-primary w-full mt-2 text-sm"
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </form>
          </div>

          {/* Bible Version Selector */}
          <div className="p-4 border-b border-brass/20">
            <select 
              value={currentVersion}
              onChange={(e) => setCurrentVersion(e.target.value)}
              className="library-input w-full"
            >
              <option value="kjv">KJV - King James Version</option>
              <option value="bbe">BBE - Bible in Basic English</option>
            </select>
          </div>

          {/* Status Messages */}
          {error && (
            <div className="p-4 bg-red-100 border-l-4 border-red-500 text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="p-4 flex items-center justify-center text-brass">
              <Loader2 className="animate-spin mr-2" size={20} />
              Loading Bible data...
            </div>
          )}

          {/* Bible Verses */}
          <div className="flex-1 overflow-y-auto library-scrollbar p-4 space-y-4">
            {bibleVerses.map((verse, index) => (
              <div
                key={`${verse.reference}-${index}`}
                className="verse-card group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-cormorant font-semibold text-wood-dark text-lg">
                    {verse.reference}
                  </h3>
                  <span className="text-xs bg-brass/20 text-wood-dark px-2 py-1 rounded">
                    {verse.version}
                  </span>
                </div>
                <p className="text-library-dark leading-relaxed italic group-hover:text-wood-dark transition-colors duration-300">
                  "{verse.text}"
                </p>
                <div className="mt-3 flex gap-2">
                  <button 
                    onClick={() => addVerseToNotes(verse)}
                    className="text-xs bg-brass/10 hover:bg-brass/20 text-wood-dark px-2 py-1 rounded transition-colors duration-300"
                  >
                    Add to Notes
                  </button>
                  <button className="text-xs bg-brass/10 hover:bg-brass/20 text-wood-dark px-2 py-1 rounded transition-colors duration-300">
                    Cross-Ref
                  </button>
                </div>
              </div>
            ))}

            {!loading && bibleVerses.length === 0 && !error && (
              <div className="text-center text-brass-light p-8">
                <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
                <p>Search for verses or browse by reference</p>
              </div>
            )}
          </div>
            </>
          )}
        </div>

        {/* Study Workspace - Center */}
        <div className="study-workspace">
          <div className="h-full flex flex-col">
            {/* Workspace Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-brass/30">
              <div>
                <h2 className="text-3xl font-cormorant text-library-dark mb-2">
                  {!isNewDocument && editingContentData?.title 
                    ? editingContentData.title 
                    : isNewDocument 
                      ? "New Document" 
                      : "Study Session"
                  }
                </h2>
                <p className="text-wood-dark italic">
                  {!isNewDocument && editingContentData?.category 
                    ? `Editing ${editingContentData.category === 'study-notes' ? 'study notes' : editingContentData.category}`
                    : isNewDocument 
                      ? `Creating new ${editorCategory === 'study-notes' ? 'study notes' : editorCategory}`
                      : `A study on ${selectedPassage}`
                  }
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleNewNote}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Plus size={16} />
                  New Note
                </button>
                <button 
                  onClick={handleSave}
                  className="btn-primary flex items-center gap-2"
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
              
              {/* Save Success Message */}
              {saveSuccess && (
                <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded-r-lg">
                  <div className="flex items-center gap-2">
                    <div className="text-green-700 font-medium">
                      ✅ Saved successfully!
                    </div>
                  </div>
                  <p className="text-green-600 text-sm mt-1">
                    Content saved to your library. Continue editing or create a New Note.
                  </p>
                </div>
              )}
            </div>

            {/* Study Content */}
            <div className="flex-1 space-y-6 overflow-y-auto library-scrollbar">
              {/* Key Themes Section */}
              <div className="bg-gradient-to-br from-wood-light/10 via-brass/5 to-wood-light/10 border-l-4 border-wood-light rounded-r-lg p-6 shadow-sm">
                <h3 className="text-xl font-cormorant text-wood-dark mb-6 flex items-center gap-2">
                  <BookOpen size={20} />
                  Theological Insights
                </h3>
                
                {aiAnalysisInProgress ? (
                  <div className="text-center py-6">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin h-6 w-6 border-2 border-brass border-t-transparent rounded-full"></div>
                      <div className="text-brass text-sm font-medium">
                        The Librarian is analyzing your content for key themes...
                      </div>
                      <div className="text-wood-dark/60 text-xs">
                        This may take up to a minute
                      </div>
                    </div>
                  </div>
                ) : !isNewDocument && editingContentData ? (
                  <div className="space-y-6">
                    {/* Key Themes */}
                    {editingContentData.key_themes && editingContentData.key_themes.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="text-lg font-cormorant text-wood-dark/90 flex items-center gap-2">
                          ✨ Key Themes
                        </h4>
                        <div className="bg-white/60 rounded-lg p-4 border border-brass/20">
                          <div className="space-y-2">
                            {editingContentData.key_themes.map((theme, themeIndex) => (
                              <div key={themeIndex} className="flex items-start gap-2">
                                <span className="text-brass/60 mt-1">•</span>
                                <span className="text-wood-dark text-sm leading-relaxed">{theme}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <h4 className="text-lg font-cormorant text-wood-dark/90 flex items-center gap-2">
                          ✨ Key Themes
                        </h4>
                        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                          <p className="text-amber-700 text-sm italic">
                            💡 Save your document with at least a paragraph of content, and the Librarian will analyze it to reveal 3 key theological themes. Each save generates fresh insights as your content evolves!
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Thought Questions */}
                    {editingContentData.thought_questions && editingContentData.thought_questions.length > 0 ? (
                      <div className="space-y-3">
                        <h4 className="text-lg font-cormorant text-wood-dark/90 flex items-center gap-2">
                          💭 Reflection Questions
                        </h4>
                        <div className="bg-brass/10 rounded-lg p-4 border-l-4 border-brass/40">
                          <div className="space-y-3">
                            {editingContentData.thought_questions.map((question, qIndex) => (
                              <div key={qIndex} className="flex items-start gap-3">
                                <span className="text-brass/70 font-bold mt-1 text-sm">Q{qIndex + 1}</span>
                                <p className="text-wood-dark text-sm leading-relaxed italic">
                                  "{question}"
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <h4 className="text-lg font-cormorant text-wood-dark/90 flex items-center gap-2">
                          💭 Reflection Questions
                        </h4>
                        <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                          <p className="text-amber-700 text-sm italic">
                            🤔 Once you save substantial content, the Librarian will craft 2 thoughtful reflection questions to deepen your spiritual understanding and application.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Tags Cloud */}
                    {editingContentData.tags && editingContentData.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {editingContentData.tags.map((tag, index) => (
                          <span 
                            key={index} 
                            className="bg-gradient-to-r from-brass/20 to-brass/10 text-wood-dark px-3 py-1 rounded-full text-xs font-medium border border-brass/30 hover:from-brass/30 hover:to-brass/20 transition-all duration-200 cursor-default"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                        <p className="text-amber-700 text-sm italic">
                          🏷️ The Librarian will automatically identify up to 5 relevant theological topics and themes from your saved content to help with organization and discovery.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-4xl mb-3 opacity-60">✍️</div>
                    <p className="text-wood-dark/60 text-sm leading-relaxed mb-3">
                      {isNewDocument 
                        ? "Begin writing your study notes or journal entry. Once you save with substantial content (at least a paragraph), the Librarian will generate personalized theological insights, reflection questions, and topic tags to enrich your spiritual study!"
                        : "Edit an existing document to see its AI-generated theological themes, reflection questions, and related topics appear here."
                      }
                    </p>
                    <p className="text-brass/70 text-xs font-medium">
                      Keep saving... keep getting new insights!
                    </p>
                  </div>
                )}
              </div>

              {/* Content Editor */}
              <div className="bg-white/80 border border-brass/30 rounded-lg p-6">
                {/* Category Radio Buttons */}
                <div className="flex items-center gap-6 mb-4 pb-4 border-b border-brass/20">
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="editorCategory"
                        value="study-notes"
                        checked={editorCategory === 'study-notes'}
                        onChange={(e) => {
                          console.log('📁 Category changed from', editorCategory, 'to', e.target.value);
                          setEditorCategory(e.target.value);
                          // Save category change to localStorage
                          if (!editingContentId) {
                            saveEditorContentToStorage(studyNotes, e.target.value);
                          }
                        }}
                        className="text-brass focus:ring-brass"
                      />
                      <span className="text-wood-dark font-medium">Study Notes</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="editorCategory"
                        value="journal"
                        checked={editorCategory === 'journal'}
                        onChange={(e) => {
                          console.log('📁 Category changed from', editorCategory, 'to', e.target.value);
                          setEditorCategory(e.target.value);
                          // Save category change to localStorage
                          if (!editingContentId) {
                            saveEditorContentToStorage(studyNotes, e.target.value);
                          }
                        }}
                        className="text-brass focus:ring-brass"
                      />
                      <span className="text-wood-dark font-medium">Journal</span>
                    </label>
                  </div>
                </div>

                {/* Dynamic Title */}
                <h3 className="text-xl font-cormorant text-wood-dark mb-4">
                  {editorCategory === 'study-notes' ? 'Study Notes' : 'Journal Entry'}
                </h3>

                {/* Content Editor */}
                <textarea
                  id="study-notes-editor"
                  value={studyNotes}
                  onChange={(e) => {
                    setStudyNotes(e.target.value);
                    if (isNewDocument && e.target.value.length > 0) {
                      setIsNewDocument(false);
                    }
                    // Auto-save to localStorage (debounced)
                    if (!editingContentId) {
                      saveEditorContentToStorage(e.target.value, editorCategory);
                    } else {
                      // For editing content, save to a separate editing session key
                      const editingSessionData = {
                        id: editingContentId,
                        content: e.target.value,
                        category: editorCategory,
                        timestamp: new Date().toISOString()
                      };
                      localStorage.setItem('editingSession', JSON.stringify(editingSessionData));
                    }
                  }}
                  placeholder={
                    isNewDocument && studyNotes === '' 
                      ? editorCategory === 'study-notes' 
                        ? `Title: Your Study Title Here\n\nMain Scripture Reference: [Book Chapter:Verse]\n\n--- Study Notes ---\n\nKey theological concepts:\n• \n• \n• \n\nCross-references:\n• \n• \n\nPersonal insights:\n\n\nQuestions for further study:\n1. \n2. \n\nPractical applications:\n•` 
                        : `Title: Your Journal Entry Title\n\nDate: ${new Date().toLocaleDateString()}\nScripture Reference: [Optional]\n\n--- Personal Reflection ---\n\nWhat is God teaching me?\n\n\nHow do I feel about this?\n\n\nWhat am I struggling with?\n\n\nPrayers and gratitude:\n\n\nNext steps:`
                      : editorCategory === 'study-notes'
                        ? "Continue your study notes... (Click 'Add to Notes' on verses to insert them)"
                        : "Continue your journal entry..."
                  }
                  className="w-full h-64 p-4 border border-brass/20 rounded-lg resize-none focus:outline-none focus:border-brass text-library-dark leading-relaxed"
                  style={{ fontSize: '14px' }}
                />
                
                {/* Template Instructions */}
                {isNewDocument && studyNotes === '' && (
                  <p className="text-xs text-wood-dark/60 mt-2 italic">
                    💡 Template shown above - start typing to begin your {editorCategory === 'study-notes' ? 'study notes' : 'journal entry'}. 
                    The title (first line) will be used as the document title when saved.
                  </p>
                )}
              </div>

              {/* Resource Viewer */}
              <div className="bg-brass/10 border border-brass/30 rounded-lg p-6">
                <h3 className="text-xl font-cormorant text-wood-dark mb-4 flex items-center gap-2">
                  📖 Resource Viewer
                </h3>
                {viewingResourceIndex !== null && selectedResources[viewingResourceIndex] ? (
                  <div className="bg-white/90 rounded-lg p-4 max-h-80 overflow-y-auto">
                    <div className="border-b border-brass/20 pb-3 mb-4">
                      <h4 className="font-cormorant font-semibold text-library-dark text-lg">
                        {selectedResources[viewingResourceIndex].title}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-wood-dark/70 mt-1">
                        <span className="capitalize">{selectedResources[viewingResourceIndex].category}</span>
                        <span>{selectedResources[viewingResourceIndex].size}</span>
                        {selectedResources[viewingResourceIndex].date_modified && (
                          <span>{new Date(selectedResources[viewingResourceIndex].date_modified).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-library-dark leading-relaxed text-sm whitespace-pre-wrap">
                      {selectedResources[viewingResourceIndex].content || 'No content available for this resource.'}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4 opacity-60">📄</div>
                    <p className="text-library-dark/70 italic">
                      No resource selected
                    </p>
                    <p className="text-library-dark/60 text-sm mt-2">
                      Select a resource from Active Resources (right panel) to view its content here while working on your study.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AI Librarian - Right Side */}
        <div className="bg-library-dark border-l border-brass/30 flex flex-col">
          {/* AI Header */}
          <div className="p-4 border-b border-brass/30 bg-brass/10">
            <h3 className="text-xl font-cormorant text-brass flex items-center gap-2">
              <MessageCircle size={20} />
              Study Librarian
            </h3>
            <p className="text-brass-light text-sm mt-1 opacity-80">
              Your AI theological assistant
            </p>
          </div>

          {/* Chat History Area - Reduced Height */}
          <div className="h-64 p-4 border-b border-brass/30 bg-library-dark/50 overflow-y-auto" id="chat-history">
            <div className="space-y-0">
              {chatHistory.length === 0 ? (
                <div className="text-center text-brass-light text-xs italic py-8">
                  Start a conversation with the Study Librarian
                </div>
              ) : (
                chatHistory.map((message) => (
                  <div key={message.id}>
                    {message.type === 'user' ? (
                      <UserMessage message={message} />
                    ) : (
                      <LibrarianMessage message={message} />
                    )}
                  </div>
                ))
              )}
              {isLibrarianTyping && <TypingIndicator />}
              {chatError && (
                <div className="bg-red-900/20 p-3 rounded-lg border border-red-500/30 mb-3">
                  <div className="text-red-300 text-sm">
                    Error: {chatError}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Input */}
          <div className="p-3 border-b border-brass/30">
            <form onSubmit={handleChatSubmit}>
              <textarea
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ask about your current study, request biblical insights, or get theological guidance..."
                className="w-full p-2 bg-cream/90 border border-brass/30 rounded text-library-dark text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brass/50"
                rows="2"
              />
              <button 
                type="submit"
                className="w-full mt-2 px-3 py-2 bg-brass text-library-dark rounded font-medium hover:bg-brass/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                disabled={!chatMessage.trim()}
              >
                Ask Librarian
              </button>
            </form>
          </div>

          {/* Active Resources - More Space */}
          <div className="h-84 p-4 border-b border-brass/30 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-cormorant text-brass">Active Resources</h4>
              <div className="flex items-center gap-4 text-xs text-brass-light">
                <span>View</span>
                <span>Remove</span>
              </div>
            </div>
            
            <div className="space-y-2">
              {[0, 1, 2, 3, 4].map(index => {
                const resource = selectedResources[index];
                return (
                  <div key={index} className="flex items-center gap-2">
                    <div className={`flex-1 p-2 rounded text-sm ${
                      resource 
                        ? 'bg-brass/10 border border-brass/30' 
                        : 'bg-cream/30 border border-brass/20 opacity-50'
                    }`} style={{ maxWidth: 'calc(100% - 70px)' }}>
                      <div className="font-medium text-cream text-xs truncate">
                        {resource ? resource.title : `Slot ${index + 1} - Empty`}
                      </div>
                      {resource && (
                        <div className="text-cream/70 text-xs mt-1">
                          {resource.category}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="viewResource"
                        value={index}
                        checked={viewingResourceIndex === index}
                        onChange={() => setViewingResourceIndex(index)}
                        disabled={!resource}
                        className="text-brass focus:ring-brass disabled:opacity-30"
                      />
                      <button
                        onClick={() => {
                          if (resource) {
                            const newResources = [...selectedResources];
                            newResources.splice(index, 1);
                            setSelectedResources(newResources);
                            localStorage.setItem('activeResources', JSON.stringify(newResources));
                            if (viewingResourceIndex === index) {
                              setViewingResourceIndex(null);
                            }
                          }
                        }}
                        disabled={!resource}
                        className="text-brass-light hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed p-1"
                        title="Remove resource"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Spacer - Add gap between Active Resources and Library Resources */}
          <div className="h-2"></div>

          {/* Library Resources - Bottom Section */}
          <div className="h-32 bg-library-brown/10">
            <div className="px-2 pt-1 pb-0">
              <h4 className="text-base font-cormorant text-brass mb-1 flex items-center gap-2">
                <FileText size={16} />
                Library Resources
              </h4>
              
              {/* Filter */}
              <div className="mb-1">
                <select 
                  value={resourceFilter}
                  onChange={(e) => setResourceFilter(e.target.value)}
                  className="w-full text-xs p-2 bg-cream/90 border border-brass/30 rounded text-library-dark"
                >
                  <option value="all">All Resources</option>
                  <option value="sermons">Sermons</option>
                  <option value="study-notes">Study Notes</option>
                  <option value="research">Research</option>
                  <option value="journal">Journal</option>
                  <option value="bookmarks">Bookmarks</option>
                </select>
              </div>

              {/* Available Resources - Increased Height */}
              <div className="max-h-44 overflow-y-auto library-scrollbar space-y-1">
                {filteredResources.map(resource => (
                  <div 
                    key={resource.id}
                    onClick={() => handleResourceSelect(resource)}
                    className={`p-2 rounded cursor-pointer text-xs transition-colors duration-200 ${
                      selectedResources.find(r => r.id === resource.id)
                        ? 'bg-brass/20 border border-brass/50' 
                        : 'bg-cream/80 hover:bg-cream border border-brass/20'
                    }`}
                  >
                    <div className="font-medium text-library-dark truncate">
                      {resource.title}
                    </div>
                    <div className="text-wood-dark opacity-70">
                      {resource.category} • {resource.size}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Confirmation Modal */}
      {showSaveModal && (
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
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
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
      )}

      {/* New Note Confirmation Modal */}
      {showNewNoteModal && (
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
                onClick={handleDontSaveNew}
                className="px-4 py-2 text-wood-dark hover:bg-gray-100 rounded transition-colors"
              >
                No
              </button>
              <button
                onClick={handleSaveBeforeNew}
                className="px-4 py-2 bg-brass text-white hover:bg-brass/90 rounded transition-colors"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudyHall;