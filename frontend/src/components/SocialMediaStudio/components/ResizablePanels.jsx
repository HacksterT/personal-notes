import React from 'react';

const ResizablePanels = ({
  leftPanelWidth,
  isDragging,
  onMouseDown,
  leftPanel,
  rightPanel
}) => {
  return (
    <div 
      data-resize-container
      style={{ 
        display: 'grid', 
        gridTemplateColumns: `${leftPanelWidth}% 4px ${100 - leftPanelWidth}%`,
        height: 'calc(100vh - 200px)',
        gap: '0'
      }}
    >
      {/* Left Panel */}
      <div style={{ overflow: 'hidden' }}>
        {leftPanel}
      </div>

      {/* Drag Handle */}
      <div
        onMouseDown={onMouseDown}
        style={{
          width: '4px',
          backgroundColor: isDragging ? '#d4af37' : '#e0e0e0',
          cursor: 'col-resize',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background-color 0.2s'
        }}
        title="Drag to resize panels"
      >
        <div style={{
          width: '2px',
          height: '40px',
          backgroundColor: isDragging ? '#654321' : '#a0a0a0',
          borderRadius: '1px'
        }} />
      </div>

      {/* Right Panel */}
      <div style={{ overflow: 'hidden' }}>
        {rightPanel}
      </div>
    </div>
  );
};

export default ResizablePanels;