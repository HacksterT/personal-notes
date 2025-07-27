import React from 'react';

const ContentInputPanel = ({
  inputContent,
  onInputChange,
  contentTitle,
  onContentTitleChange,
  contentType,
  onContentTypeChange,
  postLength,
  onPostLengthChange,
  contentTypes,
  postLengths,
  onGenerate,
  onClear,
  isLoading,
  disabled = true // Currently disabled as generation is future functionality
}) => {
  return (
    <div style={{ 
      backgroundColor: '#f4f1e8', 
      padding: '24px', 
      borderRadius: '12px', 
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      marginRight: '15px',
      overflow: 'hidden'
    }}>
      <h2 style={{ 
        fontSize: '24px', 
        fontWeight: '600', 
        marginBottom: '20px',
        color: '#654321'
      }}>
        📚 Library Resource
      </h2>
      
      {/* Content Type & Format Controls */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '14px', color: '#8B4513', fontWeight: '500' }}>
            Content Type
          </label>
          <select 
            value={contentType}
            onChange={(e) => onContentTypeChange(e.target.value)}
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
            {contentTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '14px', color: '#8B4513', fontWeight: '500' }}>
            Post Length
          </label>
          <select 
            value={postLength}
            onChange={(e) => onPostLengthChange(e.target.value)}
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
            {postLengths.map(length => (
              <option key={length} value={length}>{length}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Content Title */}
      <div style={{ marginBottom: '16px' }}>
        <input
          type="text"
          placeholder="Content title or topic..."
          value={contentTitle}
          onChange={(e) => onContentTitleChange(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '2px solid #d4af37',
            borderRadius: '6px',
            fontSize: '16px',
            color: '#654321',
            backgroundColor: '#f9f7f0',
            fontFamily: 'Crimson Text, serif'
          }}
        />
      </div>
      
      {/* Content Input Area */}
      <div style={{ position: 'relative' }}>
        <textarea
          value={inputContent}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder=""
          style={{
            width: '100%',
            height: '400px',
            padding: '16px',
            borderRadius: '8px',
            border: '2px solid rgba(212, 175, 55, 0.3)',
            backgroundColor: '#ede8d3',
            fontSize: '14px',
            color: '#654321',
            resize: 'vertical',
            marginBottom: '20px',
            lineHeight: '1.6',
            fontFamily: 'Monaco, Consolas, monospace'
          }}
        />
        {!inputContent && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            pointerEvents: 'none',
            color: '#8B4513',
            fontStyle: 'italic',
            fontSize: '18px',
            lineHeight: '1.6',
            padding: '16px'
          }}>
            <div>
              Add content from your library to transform into social media posts...
              <br />
              Or transfer content from any artifact using the share icon.
            </div>
          </div>
        )}
      </div>
      
      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        <button
          onClick={onGenerate}
          disabled={disabled || isLoading || !inputContent.trim()}
          style={{
            padding: '14px 28px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#d4af37',
            color: 'white',
            fontSize: '16px',
            fontWeight: '600',
            cursor: disabled || isLoading || !inputContent.trim() ? 'not-allowed' : 'pointer',
            opacity: disabled || isLoading || !inputContent.trim() ? 0.5 : 1,
            transition: 'all 0.2s'
          }}
        >
          {isLoading ? 'Generating...' : 'Generate Posts'}
        </button>
        <button
          onClick={onClear}
          style={{
            padding: '14px 28px',
            borderRadius: '8px',
            border: '2px solid #8B4513',
            backgroundColor: 'transparent',
            color: '#8B4513',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Clear All
        </button>
      </div>
    </div>
  );
};

export default ContentInputPanel;