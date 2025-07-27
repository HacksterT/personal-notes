import React from 'react';
import { Edit3, Eye } from 'lucide-react';

const ContentEditor = ({
  generatedContent,
  editableContent,
  onEditableContentChange,
  isPreviewMode,
  onTogglePreview
}) => {
  const displayContent = editableContent || generatedContent || '';
  
  return (
    <div style={{ color: '#654321', position: 'relative' }}>
      {isPreviewMode ? (
        /* Preview Mode */
        <div style={{
          minHeight: '360px',
          padding: '16px',
          border: '2px solid #d4af37',
          borderRadius: '6px',
          fontSize: '14px',
          lineHeight: '1.7',
          color: '#654321',
          backgroundColor: '#f9f7f0',
          fontFamily: 'Crimson Text, serif'
        }}>
          <div style={{ whiteSpace: 'pre-wrap' }}>
            {displayContent}
          </div>
        </div>
      ) : (
        /* Edit Mode */
        <textarea
          value={displayContent}
          onChange={(e) => onEditableContentChange(e.target.value)}
          style={{
            width: '100%',
            minHeight: '360px',
            padding: '16px',
            border: '2px solid #d4af37',
            borderRadius: '6px',
            fontSize: '14px',
            lineHeight: '1.7',
            color: '#654321',
            backgroundColor: '#f9f7f0',
            resize: 'vertical',
            fontFamily: 'Crimson Text, serif'
          }}
          placeholder="Your generated social media content will appear here and can be edited directly..."
        />
      )}
      
      {/* Toggle Edit/Preview Button */}
      <button
        onClick={onTogglePreview}
        style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          padding: '6px 12px',
          borderRadius: '4px',
          border: '1px solid #d4af37',
          backgroundColor: isPreviewMode ? 'transparent' : '#d4af37',
          color: isPreviewMode ? '#d4af37' : 'white',
          fontSize: '12px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          transition: 'all 0.2s'
        }}
      >
        {isPreviewMode ? <Edit3 size={12} /> : <Eye size={12} />}
        {isPreviewMode ? 'Edit' : 'Preview'}
      </button>
    </div>
  );
};

export default ContentEditor;