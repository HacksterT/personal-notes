import React from 'react';
import { Edit3, Eye } from 'lucide-react';
import ContentEditor from './ContentEditor';

const ContentOutputPanel = ({
  generatedContent,
  editableContent,
  onEditableContentChange,
  isPreviewMode,
  onTogglePreview,
  exportFormat,
  onExportFormatChange,
  exportFormats,
  disabled = true // Currently disabled as export is future functionality
}) => {
  const hasContent = generatedContent || editableContent;
  
  return (
    <div style={{ 
      backgroundColor: '#f4f1e8', 
      padding: '24px', 
      borderRadius: '12px', 
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      marginLeft: '15px',
      overflow: 'hidden'
    }}>
      <h2 style={{ 
        fontSize: '24px', 
        fontWeight: '600', 
        marginBottom: '20px',
        color: '#654321'
      }}>
        📱 Generated Content
      </h2>
      
      {/* Export Controls */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '14px', color: '#8B4513', fontWeight: '500' }}>
            Export Format
          </label>
          <select 
            value={exportFormat}
            onChange={(e) => onExportFormatChange(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #d4af37',
              backgroundColor: '#ede8d3',
              color: '#654321',
              fontSize: '14px',
              opacity: disabled ? 0.6 : 1,
              cursor: disabled ? 'not-allowed' : 'pointer'
            }}
            disabled={disabled}
          >
            {exportFormats.map(format => (
              <option key={format} value={format}>{format}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Content Display Area */}
      <div style={{
        minHeight: '400px',
        padding: '20px',
        borderRadius: '8px',
        backgroundColor: '#ede8d3',
        border: '2px solid rgba(212, 175, 55, 0.3)',
        fontSize: '14px',
        lineHeight: '1.7',
        position: 'relative'
      }}>
        {hasContent ? (
          <ContentEditor
            generatedContent={generatedContent}
            editableContent={editableContent}
            onEditableContentChange={onEditableContentChange}
            isPreviewMode={isPreviewMode}
            onTogglePreview={onTogglePreview}
          />
        ) : (
          /* Empty State */
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: '#8B4513',
            opacity: 0.6,
            pointerEvents: 'none'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📱</div>
            <div style={{ fontSize: '18px', marginBottom: '8px' }}>Ready to generate social media content</div>
            <div style={{ fontSize: '14px' }}>Add your library content and click Generate Posts</div>
            <div style={{ marginTop: '20px', fontSize: '12px', opacity: 0.7 }}>
              Coming soon: Platform-specific optimization, hashtag suggestions, and scheduling
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentOutputPanel;