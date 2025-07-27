import { useState, useCallback, useEffect } from 'react';

export const useResizablePanels = (initialLeftWidth = 40) => {
  const [leftPanelWidth, setLeftPanelWidth] = useState(initialLeftWidth);
  const [isDragging, setIsDragging] = useState(false);
  
  // Handle mouse down on resize handle
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);
  
  // Handle mouse move during drag
  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const container = document.querySelector('[data-resize-container]');
    if (!container) return;
    
    const containerRect = container.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
    
    // Set minimum and maximum widths
    const minWidth = 25; // Minimum 25% for left panel
    const maxWidth = 75; // Maximum 75% to keep right panel usable
    
    if (newLeftWidth >= minWidth && newLeftWidth <= maxWidth) {
      setLeftPanelWidth(newLeftWidth);
    }
  }, [isDragging]);
  
  // Handle mouse up to end drag
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);
  
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
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [handleMouseMove, handleMouseUp]);
  
  return {
    leftPanelWidth,
    setLeftPanelWidth,
    isDragging,
    setIsDragging,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp
  };
};