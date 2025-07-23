import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X,
  Download,
  Share2,
  Settings,
  Maximize2,
  Edit3,
  Eye
} from 'lucide-react';
import NavigationMenu from './NavigationMenu';

const SocialMediaStudio = () => {
  const navigate = useNavigate();
  const [inputContent, setInputContent] = useState('');
  const [generatedContent, setGeneratedContent] = useState('');
  const [contentTitle, setContentTitle] = useState('');
  const [editableContent, setEditableContent] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Resizable panel state (matching SermonGenerator pattern)
  const [leftPanelWidth, setLeftPanelWidth] = useState(40); // 40% left, 60% right
  const [isDragging, setIsDragging] = useState(false);
  
  // Load session data from localStorage on component mount
  useEffect(() => {
    // Check for transferred content from LibraryStacks (future feature)
    const loadTransferredContent = () => {
      try {
        const transferredContent = localStorage.getItem('socialMediaContent');
        if (transferredContent) {
          const content = JSON.parse(transferredContent);
          console.log('📱 Loading transferred content:', content);
          
          setInputContent(content.content || '');
          setContentTitle(content.title || '');
          
          // Clear the transferred content from localStorage after loading
          localStorage.removeItem('socialMediaContent');
        }
      } catch (error) {
        console.error('Failed to load transferred content:', error);
      }
    };
    
    loadTransferredContent();
    
    // Load session data from localStorage
    const loadSessionData = () => {
      try {
        const savedInputContent = localStorage.getItem('socialMedia_inputContent');
        const savedGeneratedContent = localStorage.getItem('socialMedia_generatedContent');
        const savedContentTitle = localStorage.getItem('socialMedia_contentTitle');
        const savedEditableContent = localStorage.getItem('socialMedia_editableContent');
        
        if (savedInputContent) {
          setInputContent(savedInputContent);
          console.log('📝 Loaded input content from session memory');
        }
        
        if (savedGeneratedContent) {
          setGeneratedContent(savedGeneratedContent);
          console.log('📱 Loaded generated content from session memory');
        }
        
        if (savedContentTitle) {
          setContentTitle(savedContentTitle);
          console.log('📋 Loaded content title from session memory');
        }
        
        if (savedEditableContent) {
          setEditableContent(savedEditableContent);
          console.log('✏️ Loaded editable content from session memory');
        }
      } catch (error) {
        console.error('Failed to load session data:', error);
      }
    };
    
    // Only load session data if no transferred content was loaded
    if (!localStorage.getItem('socialMediaContent')) {
      loadSessionData();
    }
  }, []);

  // Session memory update effects
  useEffect(() => {
    if (inputContent) {
      localStorage.setItem('socialMedia_inputContent', inputContent);
    }
  }, [inputContent]);

  useEffect(() => {
    if (generatedContent) {
      localStorage.setItem('socialMedia_generatedContent', generatedContent);
    }
  }, [generatedContent]);

  useEffect(() => {
    if (contentTitle) {
      localStorage.setItem('socialMedia_contentTitle', contentTitle);
    }
  }, [contentTitle]);

  useEffect(() => {
    if (editableContent) {
      localStorage.setItem('socialMedia_editableContent', editableContent);
    }
  }, [editableContent]);

  // Resizable panel handlers (matching SermonGenerator pattern)
  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const container = document.querySelector('.panel-container');
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100;
    
    // Constrain to reasonable bounds
    if (newLeftWidth >= 25 && newLeftWidth <= 75) {
      setLeftPanelWidth(newLeftWidth);
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Clear All functionality (matching SermonGenerator pattern)
  const handleClearAll = () => {
    const hasContent = inputContent.trim() || generatedContent.trim() || contentTitle.trim() || editableContent.trim();
    
    if (hasContent) {
      const userConfirmed = window.confirm('Have you saved any changes? This will clear all content and cannot be undone. Are you sure you want to continue?');
      
      if (!userConfirmed) {
        return; // User cancelled
      }
    }
    
    // Clear all state
    setInputContent('');
    setGeneratedContent('');
    setContentTitle('');
    setEditableContent('');
    setIsEditingContent(false);
    
    // Clear all localStorage session memory
    localStorage.removeItem('socialMedia_inputContent');
    localStorage.removeItem('socialMedia_generatedContent');
    localStorage.removeItem('socialMedia_contentTitle');
    localStorage.removeItem('socialMedia_editableContent');
    
    console.log('🧹 Cleared all social media session memory and content');
  };

  // Toggle content editing mode
  const toggleContentEditing = () => {
    setIsPreviewMode(!isPreviewMode);
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
        <div style={{
          marginTop: '20px',
          padding: '15px',
          backgroundColor: 'rgba(212, 175, 55, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(212, 175, 55, 0.3)',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '40px'
        }}>
          {/* Platform Selection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <strong style={{ color: '#d4af37' }}>Platform:</strong>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['Facebook', 'Twitter/X', 'Instagram', 'LinkedIn'].map(platform => (
                <button
                  key={platform}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    border: '1px solid #d4af37',
                    backgroundColor: 'transparent',
                    color: '#d4af37',
                    fontSize: '12px',
                    cursor: 'pointer',
                    opacity: 0.6,
                    textTransform: 'capitalize'
                  }}
                  disabled
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          {/* Content Format */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <strong style={{ color: '#d4af37' }}>Format:</strong>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['Post', 'Story', 'Thread', 'Carousel'].map(format => (
                <button
                  key={format}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    border: '1px solid #d4af37',
                    backgroundColor: 'transparent',
                    color: '#d4af37',
                    fontSize: '12px',
                    cursor: 'pointer',
                    opacity: 0.6,
                    textTransform: 'capitalize'
                  }}
                  disabled
                >
                  {format}
                </button>
              ))}
            </div>
          </div>
        </div>

      {/* Main Content Grid - Resizable */}
      <div 
        data-resize-container
        style={{ 
          display: 'grid', 
          gridTemplateColumns: `${leftPanelWidth}% 4px ${100 - leftPanelWidth}%`,
          height: 'calc(100vh - 200px)',
          gap: '0'
        }}
      >
        
        {/* Input Section */}
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
          
          {/* Content Type & Format Controls (Future) */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', color: '#8B4513', fontWeight: '500' }}>
                Content Type
              </label>
              <select 
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d4af37',
                  backgroundColor: '#ede8d3',
                  color: '#654321',
                  fontSize: '14px',
                  opacity: 0.6
                }}
                disabled
              >
                <option>Quote</option>
                <option>Educational</option>
                <option>Community</option>
                <option>Announcement</option>
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', color: '#8B4513', fontWeight: '500' }}>
                Post Length
              </label>
              <select 
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d4af37',
                  backgroundColor: '#ede8d3',
                  color: '#654321',
                  fontSize: '14px',
                  opacity: 0.6
                }}
                disabled
              >
                <option>Short</option>
                <option>Medium</option>
                <option>Long</option>
                <option>Thread</option>
              </select>
            </div>
          </div>
          
          {/* Content Title */}
          <div style={{ marginBottom: '16px' }}>
            <input
              type="text"
              placeholder="Content title or topic..."
              value={contentTitle}
              onChange={(e) => setContentTitle(e.target.value)}
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
          
          <div style={{ position: 'relative' }}>
            <textarea
              value={inputContent}
              onChange={(e) => setInputContent(e.target.value)}
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
          
          <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
            <button
              // onClick={handleGenerate} // Future functionality
              disabled={true}
              style={{
                padding: '14px 28px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#d4af37',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'not-allowed',
                opacity: 0.5,
                transition: 'all 0.2s'
              }}
            >
              Generate Posts
            </button>
            <button
              onClick={handleClearAll}
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

        {/* Drag Handle */}
        <div
          onMouseDown={handleMouseDown}
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

        {/* Output Section */}
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
          
          {/* Export Controls (Future) */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '14px', color: '#8B4513', fontWeight: '500' }}>
                Export Format
              </label>
              <select 
                style={{
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #d4af37',
                  backgroundColor: '#ede8d3',
                  color: '#654321',
                  fontSize: '14px',
                  opacity: 0.6
                }}
                disabled
              >
                <option>Copy Text</option>
                <option>Schedule Post</option>
                <option>Save Draft</option>
                <option>Download Image</option>
              </select>
            </div>
          </div>
          
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
            {(generatedContent || editableContent) && !isLoading && !error && (
              <div style={{ color: '#654321', position: 'relative' }}>
                {isPreviewMode ? (
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
                      {editableContent || generatedContent}
                    </div>
                  </div>
                ) : (
                  <textarea
                    value={editableContent || generatedContent || ''}
                    onChange={(e) => setEditableContent(e.target.value)}
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
                  onClick={toggleContentEditing}
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
                    gap: '4px'
                  }}
                >
                  {isPreviewMode ? <Edit3 size={12} /> : <Eye size={12} />}
                  {isPreviewMode ? 'Edit' : 'Preview'}
                </button>
              </div>
            )}

            {/* Empty State */}
            {!generatedContent && !editableContent && (
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
      </div>
      </div>
    </div>
  );
};

export default SocialMediaStudio;