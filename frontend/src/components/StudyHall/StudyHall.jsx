import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageCircle, Plus, Save, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

// Import hooks
import { useStudyEditor } from './hooks/useStudyEditor';
import { useLibrarianChat } from './hooks/useLibrarianChat';
import { useResourceLibrary } from './hooks/useResourceLibrary';

// Import components
import EditorPanel from './components/EditorPanel';
import ChatPanel from './components/ChatPanel';
import ResourcePanel from './components/ResourcePanel';
import SaveModal from './components/SaveModal';
import NewNoteModal from './components/NewNoteModal';

// Import shared components
import NavigationMenu from '../Library/NavigationMenu';

const StudyHall = () => {
  const navigate = useNavigate();
  
  // Panel accordion state
  const [isBiblePanelCollapsed, setIsBiblePanelCollapsed] = useState(false);
  
  // Use custom hooks
  const editorHook = useStudyEditor();
  const chatHook = useLibrarianChat();
  const resourceHook = useResourceLibrary();

  // Handle curating content for sermon
  const handleCurateForSermon = () => {
    // Gather main content from editor
    const mainContent = editorHook.studyNotes.trim();
    
    if (!mainContent) {
      alert('Please add some content to your study notes before curating for sermon.');
      return;
    }
    
    // Gather key themes from active resources
    const activeResourceThemes = resourceHook.selectedResources.map(resource => {
      console.log('🔍 Processing resource:', resource.title, 'Key themes:', resource.key_themes);
      return {
        title: resource.title,
        category: resource.category,
        themes: resource.key_themes || []
      };
    }).filter(resource => resource.themes.length > 0);
    
    console.log('📊 Active resource themes to send:', activeResourceThemes);
    
    // Create curated content structure
    const curatedContent = {
      mainContent: mainContent,
      activeResourceThemes: activeResourceThemes,
      timestamp: new Date().toISOString(),
      sourceDocument: editorHook.editingContentData?.title || 'Current Study Session'
    };
    
    // Store in localStorage for SermonGenerator to pick up
    localStorage.setItem('curatedSermonContent', JSON.stringify(curatedContent));
    
    // Navigate to sermon workshop
    navigate('/workshop');
  };

  // Handle Bible panel toggle
  const handleBiblePanelToggle = () => {
    setIsBiblePanelCollapsed(!isBiblePanelCollapsed);
  };

  // Wrapper for chat submit to provide required parameters
  const handleChatSubmit = (e) => {
    chatHook.handleChatSubmit(
      e, 
      editorHook.studyNotes, 
      resourceHook.selectedResources, 
      null // selectedPassage - not used in current implementation
    );
  };

  // Wrapper for insert text at cursor
  const handleInsertTextAtCursor = (text) => {
    chatHook.insertTextAtCursor(text, editorHook.studyNotes, editorHook.handleContentChange);
  };

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
        
        {/* Resource Panel - Left Side */}
        <div className="bg-library-brown/20 border-r border-brass/30 flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
          {/* Panel Header with Toggle */}
          <div className={`flex items-center border-b border-brass/30 bg-library-brown/30 transition-all duration-300 ${
            isBiblePanelCollapsed ? 'justify-center p-2' : 'justify-between p-3'
          }`}>
            {!isBiblePanelCollapsed && (
              <h3 className="text-lg font-cormorant text-brass-light">Resources</h3>
            )}
            <button
              onClick={handleBiblePanelToggle}
              className="p-1 rounded hover:bg-brass/20 transition-colors duration-200 text-brass-light hover:text-brass flex-shrink-0"
              title={isBiblePanelCollapsed ? "Expand Panel" : "Collapse Panel"}
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
                title="Expand Panel"
              >
                Resources
              </div>
            </div>
          ) : (
            <ResourcePanel 
              selectedResources={resourceHook.selectedResources}
              availableResources={resourceHook.availableResources}
              filteredResources={resourceHook.filteredResources}
              resourceFilter={resourceHook.resourceFilter}
              viewingResourceIndex={resourceHook.viewingResourceIndex}
              setResourceFilter={resourceHook.setResourceFilter}
              setViewingResourceIndex={resourceHook.setViewingResourceIndex}
              onResourceSelect={resourceHook.handleResourceSelect}
              onRemoveResource={resourceHook.handleRemoveResource}
            />
          )}
        </div>

        {/* Study Workspace - Center */}
        <div className="study-workspace">
          <div className="h-full flex flex-col">
            {/* Workspace Header */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-brass/30">
              <div>
                <h2 className="text-3xl font-cormorant text-library-dark mb-2">
                  {!editorHook.isNewDocument && editorHook.editingContentData?.title 
                    ? editorHook.editingContentData.title 
                    : editorHook.isNewDocument 
                      ? "New Document" 
                      : "Study Session"
                  }
                </h2>
                <p className="text-wood-dark italic">
                  {!editorHook.isNewDocument && editorHook.editingContentData?.category 
                    ? `Editing ${editorHook.editingContentData.category === 'study-notes' ? 'study notes' : editorHook.editingContentData.category}`
                    : editorHook.isNewDocument 
                      ? `Creating new ${editorHook.editorCategory === 'study-notes' ? 'study notes' : editorHook.editorCategory}`
                      : `A study session`
                  }
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={editorHook.handleNewNote}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Plus size={16} />
                  New Note
                </button>
                <button 
                  onClick={editorHook.handleSave}
                  className="btn-primary flex items-center gap-2"
                  disabled={editorHook.isSaving}
                >
                  {editorHook.isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  {editorHook.isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
              
              {/* Save Success Message */}
              {editorHook.saveSuccess && (
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

            {/* Editor Panel */}
            <EditorPanel
              studyNotes={editorHook.studyNotes}
              editorCategory={editorHook.editorCategory}
              isNewDocument={editorHook.isNewDocument}
              editingContentData={editorHook.editingContentData}
              currentTags={editorHook.currentTags}
              editingContentId={editorHook.editingContentId}
              aiAnalysisInProgress={editorHook.aiAnalysisInProgress}
              onContentChange={editorHook.handleContentChange}
              onCategoryChange={editorHook.handleCategoryChange}
              onTagsChange={editorHook.handleTagsChange}
            />
          </div>
        </div>

        {/* Chat Panel - Right Side */}
        <ChatPanel
          chatMessage={chatHook.chatMessage}
          chatHistory={chatHook.chatHistory}
          isLibrarianTyping={chatHook.isLibrarianTyping}
          chatError={chatHook.chatError}
          includeNoteContext={chatHook.includeNoteContext}
          setChatMessage={chatHook.setChatMessage}
          setIncludeNoteContext={chatHook.setIncludeNoteContext}
          onChatSubmit={handleChatSubmit}
          onInsertTextAtCursor={handleInsertTextAtCursor}
        />
      </div>

      {/* Modals */}
      <SaveModal
        showSaveModal={editorHook.showSaveModal}
        isSaving={editorHook.isSaving}
        studyNotes={editorHook.studyNotes}
        editorCategory={editorHook.editorCategory}
        extractTitle={editorHook.extractTitle}
        onConfirmSave={editorHook.handleConfirmSave}
        onCancel={() => editorHook.setShowSaveModal(false)}
      />

      <NewNoteModal
        showNewNoteModal={editorHook.showNewNoteModal}
        onSaveBeforeNew={editorHook.handleSaveBeforeNew}
        onDontSaveNew={editorHook.handleDontSaveNew}
        onCancel={() => editorHook.setShowNewNoteModal(false)}
      />
    </div>
  );
};

export default StudyHall;