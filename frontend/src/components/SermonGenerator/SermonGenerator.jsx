import React, { useState } from 'react';

// Import hooks
import { useSermonForm } from './hooks/useSermonForm';
import { useSermonGeneration } from './hooks/useSermonGeneration';
import { useSermonSaveExport } from './hooks/useSermonSaveExport';

// Import components
import SermonForm from './components/SermonForm';
import SermonPreview from './components/SermonPreview';
import SaveModal from './components/SaveModal';
import ResizablePanels from './components/ResizablePanels';

// Import shared components
import NavigationMenu from '../Library/NavigationMenu';

const SermonGenerator = () => {

  // Resizable panels state
  const [leftPanelWidth, setLeftPanelWidth] = useState(40); // percentage
  const [isDragging, setIsDragging] = useState(false);

  // Use custom hooks
  const formHook = useSermonForm();
  const generationHook = useSermonGeneration();
  const saveExportHook = useSermonSaveExport();

  // Handle generation with form data
  const handleGenerate = () => {
    const formData = {
      inputText: formHook.inputText,
      sermonType: formHook.sermonType,
      speakingStyle: formHook.speakingStyle,
      sermonLength: formHook.sermonLength,
      outputFormat: formHook.outputFormat
    };
    generationHook.handleGenerate(formData);
  };

  // Handle export with current content
  const handleExport = (format) => {
    saveExportHook.handleExport(
      format,
      generationHook.generatedSermon,
      generationHook.sermonTitle
    );
  };

  // Handle save with current content
  const handleConfirmSave = () => {
    saveExportHook.handleConfirmSave(
      generationHook.generatedSermon,
      generationHook.sermonTitle,
      formHook.inputText
    );
  };

  // Handle combined clear
  const handleClear = () => {
    formHook.handleClear();
    generationHook.handleClear();
  };

  // Load editing sermon data on mount if available
  React.useEffect(() => {
    const editingSermon = formHook.loadEditingSermon();
    if (editingSermon) {
      generationHook.loadEditingSermon(editingSermon);
    }
  }, []);

  return (
    <div className="min-h-screen bg-library-gradient">
      {/* Header */}
      <div className="bg-library-dark/90 border-b-2 border-brass px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <NavigationMenu />
          <div className="h-6 w-px bg-brass/30" />
          <h1 className="text-2xl font-cormorant text-brass">
            🎤 Sermon Workshop
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-sm text-brass-light">
            AI-Powered Sermon Generation
          </div>
        </div>
      </div>

      {/* Main Content - Resizable Panels */}
      <div className="h-[calc(100vh-80px)]">
        <ResizablePanels
          leftPanelWidth={leftPanelWidth}
          setLeftPanelWidth={setLeftPanelWidth}
          isDragging={isDragging}
          setIsDragging={setIsDragging}
          leftPanel={
            <SermonForm
              inputText={formHook.inputText}
              onInputChange={formHook.setInputText}
              sermonType={formHook.sermonType}
              onSermonTypeChange={formHook.setSermonType}
              speakingStyle={formHook.speakingStyle}
              onSpeakingStyleChange={formHook.setSpeakingStyle}
              sermonLength={formHook.sermonLength}
              onSermonLengthChange={formHook.setSermonLength}
              outputFormat={formHook.outputFormat}
              onOutputFormatChange={formHook.setOutputFormat}
              onGenerate={handleGenerate}
              onClear={handleClear}
              onLoadTemplate={formHook.loadTemplate}
              isLoading={generationHook.isLoading}
              templates={formHook.templates}
            />
          }
          rightPanel={
            <SermonPreview
              generatedSermon={generationHook.generatedSermon}
              sermonTitle={generationHook.sermonTitle}
              isEditingTitle={generationHook.isEditingTitle}
              isEditingContent={generationHook.isEditingContent}
              editableContent={generationHook.editableContent}
              isPreviewMode={generationHook.isPreviewMode}
              error={generationHook.error}
              onTitleEdit={generationHook.handleTitleEdit}
              onStartEditing={generationHook.handleStartEditing}
              onSaveEdit={generationHook.handleSaveEdit}
              onCancelEdit={generationHook.handleCancelEdit}
              onContentChange={generationHook.setEditableContent}
              onTogglePreview={generationHook.togglePreviewMode}
              onExport={handleExport}
              onSave={saveExportHook.handleSave}
              showExportDropdown={saveExportHook.showExportDropdown}
              onToggleExportDropdown={saveExportHook.toggleExportDropdown}
              saveSuccess={saveExportHook.saveSuccess}
            />
          }
        />
      </div>

      {/* Save Modal */}
      <SaveModal
        showSaveModal={saveExportHook.showSaveModal}
        isSaving={saveExportHook.isSaving}
        sermonTitle={generationHook.sermonTitle}
        generatedSermon={generationHook.generatedSermon}
        onConfirmSave={handleConfirmSave}
        onCancel={saveExportHook.handleCancelSave}
      />
    </div>
  );
};

export default SermonGenerator;