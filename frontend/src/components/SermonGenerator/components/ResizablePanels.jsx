import React, { useCallback, useEffect } from 'react';

const ResizablePanels = ({
  leftPanelWidth,
  setLeftPanelWidth,
  isDragging,
  setIsDragging,
  leftPanel,
  rightPanel
}) => {
  // Handle mouse down on resize handle
  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  // Handle mouse move during drag
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const container = document.querySelector('[data-resize-container]');
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Set minimum and maximum widths
    const minWidth = 25; // Minimum 25% for buttons/dropdowns
    const maxWidth = 75; // Maximum 75% to keep right panel usable
    
    if (newLeftWidth >= minWidth && newLeftWidth <= maxWidth) {
      setLeftPanelWidth(newLeftWidth);
    }
  }, [isDragging, setLeftPanelWidth]);

  // Handle mouse up to end drag
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, [setIsDragging]);

  // Add global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div 
      className="flex h-full"
      data-resize-container
    >
      {/* Left Panel */}
      <div 
        className="bg-wood-light/5 border-r border-wood-light/30 overflow-y-auto"
        style={{ width: `${leftPanelWidth}%` }}
      >
        <div className="p-6">
          {leftPanel}
        </div>
      </div>

      {/* Resize Handle */}
      <div
        className={`w-1 bg-wood-light/30 hover:bg-brass/50 cursor-col-resize transition-colors duration-200 ${
          isDragging ? 'bg-brass' : ''
        }`}
        onMouseDown={handleMouseDown}
      />

      {/* Right Panel */}
      <div 
        className="bg-white overflow-y-auto"
        style={{ width: `${100 - leftPanelWidth}%` }}
      >
        <div className="p-6 h-full">
          {rightPanel}
        </div>
      </div>
    </div>
  );
};

export default ResizablePanels;