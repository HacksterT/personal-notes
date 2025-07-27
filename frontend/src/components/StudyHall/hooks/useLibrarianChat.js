import { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';

export const useLibrarianChat = () => {
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLibrarianTyping, setIsLibrarianTyping] = useState(false);
  const [chatError, setChatError] = useState('');
  const [includeNoteContext, setIncludeNoteContext] = useState(true);

  // Auto-scroll chat to bottom when messages change
  useEffect(() => {
    const chatElement = document.getElementById('chat-history');
    if (chatElement) {
      chatElement.scrollTop = chatElement.scrollHeight;
    }
  }, [chatHistory, isLibrarianTyping]);

  const handleChatSubmit = async (e, studyNotes, selectedResources, selectedPassage) => {
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
      
      // Build context based on radio button selection
      const context = includeNoteContext ? {
        current_passage: selectedPassage,
        study_notes: studyNotes.substring(0, 1000), // First 1000 chars for context
        active_resources: selectedResources.map(resource => ({
          title: resource.title,
          category: resource.category,
          key_themes: resource.key_themes || []
        }))
      } : {
        mode: 'general_biblical_guidance' // Signal for backend to use KJV-focused prompt
      };
      
      // Call backend API
      const response = await fetch(`${apiService.baseURL}/api/chat/librarian`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: currentMessage,
          conversation_history: conversationHistory,
          context: context
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

  // Insert text at cursor position in the study notes editor
  const insertTextAtCursor = (textToInsert, studyNotes, setStudyNotes) => {
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

  return {
    // State
    chatMessage,
    chatHistory,
    isLibrarianTyping,
    chatError,
    includeNoteContext,

    // Actions
    setChatMessage,
    setIncludeNoteContext,
    handleChatSubmit,
    insertTextAtCursor
  };
};