import React from 'react';
import { useNavigate } from 'react-router-dom';

// Import hooks
import { useSocialMediaForm } from './hooks/useSocialMediaForm';
import { useSocialMediaSession } from './hooks/useSocialMediaSession';
import { useResizablePanels } from './hooks/useResizablePanels';

// Import components
import PlatformSelector from './components/PlatformSelector';
import ContentInputPanel from './components/ContentInputPanel';
import ContentOutputPanel from './components/ContentOutputPanel';
import ResizablePanels from './components/ResizablePanels';

// Import shared components
import NavigationMenu from '../Library/NavigationMenu';

const SocialMediaStudio = () => {
  const navigate = useNavigate();

  // Use custom hooks
  const formHook = useSocialMediaForm();
  const resizableHook = useResizablePanels(40); // 40% initial left panel width
  
  // Use session management hook
  const sessionHook = useSocialMediaSession({
    inputContent: formHook.inputContent,
    setInputContent: formHook.setInputContent,
    generatedContent: formHook.generatedContent,
    setGeneratedContent: formHook.setGeneratedContent,
    contentTitle: formHook.contentTitle,
    setContentTitle: formHook.setContentTitle,
    editableContent: formHook.editableContent,
    setEditableContent: formHook.setEditableContent
  });

  // Handle clear with session data cleanup
  const handleClear = () => {
    const cleared = formHook.handleClear();
    if (cleared) {
      sessionHook.clearSessionData();
    }
  };

  return (
    <div className="min-h-screen bg-library-gradient">
      <div style={{ 
        fontFamily: 'Crimson Text, serif',
        maxWidth: '1600px', 
        margin: '0 auto',
        color: '#f4f1e8',
        padding: '0 20px 20px 20px'
      }}>
        
        {/* Header */}
        <div className="bg-library-dark/90 border-b-2 border-brass px-6 py-4 flex items-center justify-between shadow-lg mb-8">
          <div className="flex items-center gap-4">
            <NavigationMenu />
            
            <div className="h-6 w-px bg-brass/30" />
            
            <h1 className="text-2xl font-cormorant text-brass">
              📱 Social Media Studio
            </h1>
          </div>
        </div>
      
        {/* Platform Selection Configuration Bar */}
        <PlatformSelector
          selectedPlatform={formHook.selectedPlatform}
          selectedFormat={formHook.selectedFormat}
          platforms={formHook.platforms}
          formats={formHook.formats}
          onPlatformSelect={formHook.handlePlatformSelect}
          onFormatSelect={formHook.handleFormatSelect}
        />

        {/* Main Content - Resizable Panels */}
        <ResizablePanels
          leftPanelWidth={resizableHook.leftPanelWidth}
          isDragging={resizableHook.isDragging}
          onMouseDown={resizableHook.handleMouseDown}
          leftPanel={
            <ContentInputPanel
              inputContent={formHook.inputContent}
              onInputChange={formHook.setInputContent}
              contentTitle={formHook.contentTitle}
              onContentTitleChange={formHook.setContentTitle}
              contentType={formHook.contentType}
              onContentTypeChange={formHook.handleContentTypeChange}
              postLength={formHook.postLength}
              onPostLengthChange={formHook.handlePostLengthChange}
              contentTypes={formHook.contentTypes}
              postLengths={formHook.postLengths}
              onGenerate={formHook.handleGenerate}
              onClear={handleClear}
              isLoading={formHook.isLoading}
            />
          }
          rightPanel={
            <ContentOutputPanel
              generatedContent={formHook.generatedContent}
              editableContent={formHook.editableContent}
              onEditableContentChange={formHook.setEditableContent}
              isPreviewMode={formHook.isPreviewMode}
              onTogglePreview={formHook.togglePreviewMode}
              exportFormat={formHook.exportFormat}
              onExportFormatChange={formHook.handleExportFormatChange}
              exportFormats={formHook.exportFormats}
            />
          }
        />
      </div>
    </div>
  );
};

export default SocialMediaStudio;