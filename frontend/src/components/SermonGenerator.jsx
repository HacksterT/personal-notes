import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Edit3, ChevronDown, Save, Loader2, Eye, Edit } from 'lucide-react';
import NavigationMenu from './Library/NavigationMenu';
import { apiService } from '../services/api';

// Simple markdown renderer with library theme styling
const MarkdownRenderer = ({ content }) => {
  const styles = `
    h1 { font-size: 24px; font-weight: 600; margin: 12px 0 8px 0; color: #654321; }
    h2 { font-size: 20px; font-weight: 600; margin: 10px 0 6px 0; color: #654321; }
    h3 { font-size: 18px; font-weight: 600; margin: 8px 0 5px 0; color: #654321; }
    h4 { font-size: 16px; font-weight: 600; margin: 6px 0 4px 0; color: #8B4513; }
    strong { font-weight: 600; color: #654321; }
    em { font-style: italic; color: #8B4513; }
    ul { margin: 8px 0; padding-left: 24px; }
    ol { margin: 8px 0; padding-left: 24px; }
    li { margin: 3px 0; }
    ul li { list-style-type: disc; }
    ul ul li { list-style-type: circle; }
    ul ul ul li { list-style-type: square; }
    ol li { list-style-type: decimal; }
    p { margin: 8px 0; line-height: 1.6; }
    blockquote { 
      margin: 12px 0; 
      padding: 8px 16px; 
      border-left: 4px solid #d4af37; 
      background-color: #f4f1e8; 
      font-style: italic; 
    }
    .scripture { 
      background-color: #ede8d3; 
      padding: 12px; 
      border-radius: 6px; 
      margin: 8px 0; 
      border-left: 4px solid #d4af37; 
    }
  `;
  
  const renderMarkdown = (text) => {
    let html = text;
    
    // Handle scripture references (custom formatting)
    html = html.replace(/\*Scripture: (.*?)\*/g, '<div class="scripture"><strong>Scripture:</strong> $1</div>');
    
    // Handle headers
    html = html.replace(/^#### (.*?)$/gm, '<h4>$1</h4>');
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    
    // Handle bold and italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Handle blockquotes
    html = html.replace(/^> (.*?)$/gm, '<blockquote>$1</blockquote>');
    
    // Process lists and paragraphs
    const lines = html.split('\n');
    const processedLines = [];
    let listStack = [];
    
    for (let line of lines) {
      const bulletMatch = line.match(/^(\s*)[-*+] (.+)$/);
      const numberMatch = line.match(/^(\s*)\d+\.\s(.+)$/);
      
      if (bulletMatch || numberMatch) {
        const match = bulletMatch || numberMatch;
        const indentLevel = Math.floor(match[1].length / 2);
        const content = match[2];
        const listType = bulletMatch ? 'ul' : 'ol';
        
        while (listStack.length > indentLevel + 1) {
          const closingTag = listStack.pop();
          processedLines.push(`</${closingTag}>`);
        }
        
        if (listStack.length === indentLevel) {
          processedLines.push(`<${listType}>`);
          listStack.push(listType);
        }
        
        processedLines.push(`<li>${content}</li>`);
      } else {
        while (listStack.length > 0) {
          const closingTag = listStack.pop();
          processedLines.push(`</${closingTag}>`);
        }
        
        if (line.trim() === '') {
          processedLines.push('<br />');
        } else if (!line.match(/^<[^>]+>/)) {
          processedLines.push(`<p>${line}</p>`);
        } else {
          processedLines.push(line);
        }
      }
    }
    
    while (listStack.length > 0) {
      const closingTag = listStack.pop();
      processedLines.push(`</${closingTag}>`);
    }
    
    return processedLines.join('');
  };

  return (
    <>
      <style>{styles}</style>
      <div dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }} />
    </>
  );
};

const SermonGenerator = () => {
  const navigate = useNavigate();
  const [inputText, setInputText] = useState('');
  const [generatedSermon, setGeneratedSermon] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sermonTitle, setSermonTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  
  // Sermon configuration state
  const [sermonType, setSermonType] = useState('topical');
  const [speakingStyle, setSpeakingStyle] = useState('conversational');
  const [sermonLength, setSermonLength] = useState('20-25');
  const [outputFormat, setOutputFormat] = useState('full');
  const [sessionMemory, setSessionMemory] = useState({
    theme: '',
    scriptures: [],
    keyPoints: [],
    audience: '',
    sessionStartTime: null
  });

  // Initialize session memory and load curated content on component mount
  useEffect(() => {
    setSessionMemory(prev => ({
      ...prev,
      sessionStartTime: new Date().toISOString()
    }));
    
    // Check for curated content from StudyHall
    const loadCuratedContent = () => {
      try {
        const curatedContent = localStorage.getItem('curatedSermonContent');
        if (curatedContent) {
          const content = JSON.parse(curatedContent);
          console.log('📖 Loading curated content:', content);
          
          // Format the content for the sermon generator
          let formattedContent = `Source: ${content.sourceDocument}\nGenerated: ${new Date(content.timestamp).toLocaleString()}\n\n`;
          formattedContent += `=== MAIN STUDY CONTENT ===\n${content.mainContent}\n\n`;
          
          // Add active resource themes
          if (content.activeResourceThemes && content.activeResourceThemes.length > 0) {
            formattedContent += `=== SUPPORTING THEMES FROM ACTIVE RESOURCES ===\n`;
            content.activeResourceThemes.forEach((resource, index) => {
              formattedContent += `\n${index + 1}. ${resource.title} (${resource.category})\n`;
              if (resource.themes && resource.themes.length > 0) {
                resource.themes.forEach(theme => {
                  formattedContent += `   • ${theme}\n`;
                });
              }
            });
          }
          
          setInputText(formattedContent);
          
          // Clear the curated content from localStorage after loading
          localStorage.removeItem('curatedSermonContent');
        }
      } catch (error) {
        console.error('Failed to load curated content:', error);
      }
    };
    
    loadCuratedContent();
  }, []);

  // Session memory update function
  const updateSessionMemory = (key, value) => {
    setSessionMemory(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Sample templates for different sermon types
  const templates = {
    topical: `Topic: The Power of Faith in Difficult Times

Key Scripture: Hebrews 11:1-6

Audience: General congregation facing various life challenges

Outline:
- Opening: Personal story about overcoming doubt
- Main points to explore:
  1. What is faith according to Scripture?
  2. How does faith work in practical situations?
  3. Examples of faith from biblical heroes
- Application: How to strengthen faith in daily life
- Closing prayer focus: Trust and surrender

Additional thoughts:
- Include story about Abraham's journey
- Reference modern examples of faithful believers
- Address common doubts and questions
- Emphasize God's faithfulness throughout history`,

    expository: `Scripture Passage: Romans 8:28-30

Sermon Type: Expository preaching through Romans

Context: Paul's letter addressing suffering and God's sovereignty

Exegetical notes:
- "All things work together for good" - Greek word "synergeo"
- "Those who love God" - defining the recipients
- "Called according to purpose" - divine election theme
- Connection to verses 31-39 about God's love

Application points:
- How do we understand suffering in light of God's goodness?
- What does it mean to be "called according to His purpose"?
- Practical steps for trusting God in difficult circumstances

Historical context: 
- Paul writing to mixed Jewish/Gentile church in Rome
- Addressing persecution and suffering of early Christians`,

    narrative: `Biblical Narrative: The Prodigal Son (Luke 15:11-32)

Sermon approach: Retelling with modern application

Characters and their representation:
- Younger son: The lost, rebellious heart
- Father: God's unconditional love and grace
- Older son: Religious pride and self-righteousness

Story structure:
1. The departure - choosing our own way
2. The consequences - living with our choices
3. The return - repentance and restoration
4. The celebration - joy in heaven over one sinner

Modern parallels:
- Leaving home vs. leaving God
- Financial bankruptcy vs. spiritual bankruptcy
- Coming to our senses in a broken world
- The Father's heart for restoration

Discussion questions for small groups:
- Which character do you most identify with?
- How have you experienced the Father's love?`
  };

  const loadTemplate = (type) => {
    setInputText(templates[type]);
    setGeneratedSermon('');
    setError('');
    
    // Update session memory with template info
    updateSessionMemory('theme', type);
  };

  const handleGenerate = async () => {
    if (!inputText.trim()) {
      setError('Please import your sermon notes.');
      return;
    }

    setIsLoading(true);
    setError('');
    setGeneratedSermon('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120-second timeout

    try {
      // Extract key information for session memory
      const extractedTheme = inputText.match(/Topic:|Scripture Passage:|Biblical Narrative: (.*?)$/m)?.[1] || 'General';
      const extractedScriptures = inputText.match(/Scripture[^:]*: ([^\n]+)/gi) || [];
      const extractedAudience = inputText.match(/Audience: ([^\n]+)/i)?.[1] || 'General congregation';
      
      // Update session memory
      updateSessionMemory('theme', extractedTheme);
      updateSessionMemory('scriptures', extractedScriptures);
      updateSessionMemory('audience', extractedAudience);

      // Create comprehensive prompt with all configuration settings
      const getFormatInstructions = () => {
        switch (outputFormat) {
          case 'outline':
            return `
Format as a detailed outline with:
- Roman numerals for main points (I., II., III.)
- Capital letters for sub-points (A., B., C.)
- Numbers for supporting details (1., 2., 3.)
- Scripture references in parentheses
- Include time estimates for each section`;
          
          case 'bullets':
            return `
Format as bullet points with:
- Main themes as primary bullets
- Supporting points as sub-bullets
- Scripture references in italics
- Keep concise for extemporaneous speaking`;
          
          case 'notes':
            return `
Format as notes + outline hybrid with:
- Main points fully written out
- Supporting details in bullet format
- Illustrations briefly described
- Application sections in paragraph form`;
          
          default: // full sermon
            return `
Format as a complete sermon manuscript with:
- Clear markdown headings (# ## ###)
- Scripture references in *italics*
- Main points numbered and developed
- Illustrations in blockquotes
- Application sections clearly marked
- Smooth transitions between sections`;
        }
      };

      const getLengthGuidance = () => {
        switch (sermonLength) {
          case '10-15':
            return '10-15 minutes (about 1,500-2,000 words). Focus on one main point with clear application.';
          case '30-35':
            return '30-35 minutes (about 4,000-5,000 words). Develop 3-4 main points with detailed illustrations.';
          case '45+':
            return '45+ minutes (about 6,000+ words). Comprehensive teaching with multiple points and extensive application.';
          default: // 20-25
            return '20-25 minutes (about 2,500-3,500 words). 2-3 main points with balanced teaching and application.';
        }
      };

      const getStyleGuidance = () => {
        switch (speakingStyle) {
          case 'conversational':
            return 'Use warm, relatable language. Include personal anecdotes and questions to engage the audience.';
          case 'authoritative':
            return 'Use confident, pastoral tone. Emphasize biblical authority and clear doctrinal teaching.';
          case 'storytelling':
            return 'Weave narratives throughout. Use vivid illustrations and metaphors to convey truth.';
          case 'academic':
            return 'Include scholarly insights, original language references, and detailed exegesis.';
          case 'inspirational':
            return 'Focus on encouragement and motivation. Use uplifting language and hope-filled application.';
          default:
            return 'Use clear, engaging pastoral communication.';
        }
      };

      const getTypeGuidance = () => {
        switch (sermonType) {
          case 'expository':
            return 'Work through the biblical text systematically, explaining meaning and application verse by verse.';
          case 'topical':
            return 'Address the central theme using multiple scripture passages to support the main points.';
          case 'narrative':
            return 'Tell the story (biblical or contemporary) with clear lessons and modern applications.';
          case 'textual':
            return 'Focus deeply on the specific text provided, drawing out all theological and practical implications.';
          case 'biographical':
            return 'Follow the biblical character\'s journey, drawing life lessons and spiritual principles.';
          default:
            return 'Structure the sermon according to the content provided.';
        }
      };

      const prompt = `
You are an experienced pastor creating a ${sermonType} sermon in a ${speakingStyle} style.

SERMON SPECIFICATIONS:
- Type: ${sermonType.charAt(0).toUpperCase() + sermonType.slice(1)} - ${getTypeGuidance()}
- Style: ${speakingStyle.charAt(0).toUpperCase() + speakingStyle.slice(1)} - ${getStyleGuidance()}
- Length: ${getLengthGuidance()}
- Output Format: ${outputFormat.charAt(0).toUpperCase() + outputFormat.slice(1)}

FORMATTING REQUIREMENTS:
${getFormatInstructions()}

CONTENT TO WORK WITH:
${inputText}

Generate a ${outputFormat === 'full' ? 'complete sermon manuscript' : outputFormat} that pastors can use directly. Ensure biblical accuracy, practical application, and engaging delivery that connects with people's real-life struggles and encourages spiritual growth.
      `;

      // Make API call to backend sermon generation endpoint
      const response = await fetch('/api/sermon/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: inputText,
          sermonType: sermonType,
          speakingStyle: speakingStyle,
          sermonLength: sermonLength,
          outputFormat: outputFormat
        }),
        signal: controller.signal // Add abort signal to the request
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `API Error: ${response.status}`);
      }

      const data = await response.json();
      setGeneratedSermon(data.sermon);
      setEditableContent(data.sermon);
      
      // Extract title from the generated sermon
      const extractedTitle = extractTitleFromSermon(data.sermon);
      setSermonTitle(extractedTitle);
      
      // Update session memory with generated content
      updateSessionMemory('keyPoints', ['Shepherd', 'Provider', 'Restorer', 'Present in valleys']);
      
    } catch (err) {
      console.error('Sermon generation error:', err);
      
      // Handle different types of errors
      if (err.name === 'AbortError') {
        setError('Request timed out: The sermon generation is taking longer than expected. Please try again.');
      } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setError('Network error: Unable to connect to the server. Please check your connection and try again.');
      } else if (err.message.includes('API Error: 500')) {
        setError('Server error: The AI service is temporarily unavailable. Please try again in a moment.');
      } else if (err.message.includes('API Error: 400')) {
        setError('Invalid request: Please check your input and configuration settings.');
      } else if (err.message.includes('API Error: 429')) {
        setError('Rate limit exceeded: Too many requests. Please wait a moment and try again.');
      } else {
        setError(`Error generating sermon: ${err.message || 'Unknown error occurred'}`);
      }
    } finally {
      clearTimeout(timeoutId); // Clear the timeout
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setGeneratedSermon('');
    setError('');
    // Reset session memory except start time
    setSessionMemory(prev => ({
      theme: '',
      scriptures: [],
      keyPoints: [],
      audience: '',
      sessionStartTime: prev.sessionStartTime
    }));
  };

  // Extract title from sermon content
  const extractTitleFromSermon = (sermon) => {
    if (!sermon) return 'Untitled Sermon';
    
    const lines = sermon.split('\n');
    for (let line of lines) {
      line = line.trim();
      // Look for first heading or title-like line
      if (line.startsWith('# ')) {
        return line.substring(2).trim();
      } else if (line.startsWith('## ')) {
        return line.substring(3).trim();
      } else if (line.length > 10 && line.length < 100 && !line.includes('.') && line.match(/^[A-Z]/)) {
        return line;
      }
    }
    return 'Untitled Sermon';
  };

  // Export functions
  const exportAsText = (content) => {
    const fullContent = `${sermonTitle}\n\n${content}`;
    const blob = new Blob([fullContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sermonTitle.replace(/[^a-zA-Z0-9]/g, '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAsWord = (content) => {
    // Simple HTML to Word conversion
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${sermonTitle}</title>
        <style>
          body { font-family: 'Times New Roman', serif; line-height: 1.6; margin: 1in; }
          h1 { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
          h2 { font-size: 20px; font-weight: bold; margin: 20px 0 10px 0; }
          h3 { font-size: 18px; font-weight: bold; margin: 15px 0 10px 0; }
          p { margin: 10px 0; }
        </style>
      </head>
      <body>
        <h1>${sermonTitle}</h1>
        ${content.replace(/\n/g, '<br>')}
      </body>
      </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${sermonTitle.replace(/[^a-zA-Z0-9]/g, '_')}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const exportAsPDF = (content) => {
    // For PDF export, we'll use the browser's print functionality
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${sermonTitle}</title>
        <style>
          body { font-family: 'Times New Roman', serif; line-height: 1.6; margin: 1in; }
          h1 { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
          h2 { font-size: 20px; font-weight: bold; margin: 20px 0 10px 0; }
          h3 { font-size: 18px; font-weight: bold; margin: 15px 0 10px 0; }
          p { margin: 10px 0; }
          @media print {
            body { margin: 0.5in; }
          }
        </style>
      </head>
      <body>
        <h1>${sermonTitle}</h1>
        ${content.replace(/\n/g, '<br>')}
        <script>
          window.onload = function() {
            window.print();
            window.close();
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExport = (format) => {
    setShowExportDropdown(false);
    const contentToExport = isEditingContent ? editableContent : generatedSermon;
    switch (format) {
      case 'txt':
        exportAsText(contentToExport);
        break;
      case 'word':
        exportAsWord(contentToExport);
        break;
      case 'pdf':
        exportAsPDF(contentToExport);
        break;
    }
  };

  const handleSave = () => {
    if (!sermonTitle.trim() || !editableContent.trim()) {
      alert('Please ensure both title and content are filled before saving.');
      return;
    }
    
    setShowSaveModal(true);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      const contentData = {
        title: sermonTitle,
        content: editableContent,
        category: 'sermons',
        filename: `${sermonTitle.replace(/[^a-zA-Z0-9]/g, '_')}.md`
      };

      console.log('💾 Saving sermon to library:', contentData.title);
      
      // Create a file from the sermon content (like StudyHall does)
      const blob = new Blob([contentData.content], { type: 'text/markdown' });
      const file = new File([blob], contentData.filename, { type: 'text/markdown' });
      
      // Use the upload API to save the sermon
      const result = await apiService.uploadFiles([file], contentData.category);
      
      console.log('✅ Sermon saved successfully:', result);
      setSaveSuccess(true);
      setShowSaveModal(false);
      
      // Show success message briefly
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (error) {
      console.error('❌ Save failed:', error);
      alert('Failed to save sermon. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleContentEditing = () => {
    if (isEditingContent) {
      // Save changes and exit editing
      setGeneratedSermon(editableContent);
      setIsEditingContent(false);
    } else {
      // Enter editing mode
      setIsEditingContent(true);
    }
  };

  return (
    <div className="min-h-screen bg-library-gradient">
      <div style={{ 
        fontFamily: 'Crimson Text, serif',
        maxWidth: '1400px', 
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
              ✍️ Sermon Workshop
            </h1>
          </div>
          
          <div className="text-brass-light text-sm">
            AI-Powered Sermon Development with Intelligent Memory
          </div>
        </div>
        
        {/* Sermon Configuration Bar */}
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
          {/* Sermon Type */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <strong style={{ color: '#d4af37' }}>Type:</strong>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['expository', 'topical', 'narrative', 'textual', 'biographical'].map(type => (
                <button
                  key={type}
                  onClick={() => setSermonType(type)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    border: '1px solid #d4af37',
                    backgroundColor: sermonType === type ? '#d4af37' : 'transparent',
                    color: sermonType === type ? '#000' : '#d4af37',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Speaking Style */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <strong style={{ color: '#d4af37' }}>Style:</strong>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['conversational', 'authoritative', 'storytelling', 'academic', 'inspirational'].map(style => (
                <button
                  key={style}
                  onClick={() => setSpeakingStyle(style)}
                  style={{
                    padding: '4px 12px',
                    borderRadius: '12px',
                    border: '1px solid #d4af37',
                    backgroundColor: speakingStyle === style ? '#d4af37' : 'transparent',
                    color: speakingStyle === style ? '#000' : '#d4af37',
                    fontSize: '12px',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Main Content Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' }}>
          
          {/* Input Section */}
          <div style={{ backgroundColor: '#f4f1e8', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <h2 style={{ 
              fontSize: '24px', 
              fontWeight: '600', 
              marginBottom: '20px',
              color: '#654321'
            }}>
              Sermon Notes & Outline
            </h2>
            
            {/* Length & Format Controls */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '14px', color: '#8B4513', fontWeight: '500' }}>
                  Length
                </label>
                <select 
                  value={sermonLength} 
                  onChange={(e) => setSermonLength(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #d4af37',
                    backgroundColor: '#ede8d3',
                    color: '#654321',
                    fontSize: '14px'
                  }}
                >
                  <option value="10-15">10-15 minutes</option>
                  <option value="20-25">20-25 minutes</option>
                  <option value="30-35">30-35 minutes</option>
                  <option value="45+">45+ minutes</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '14px', color: '#8B4513', fontWeight: '500' }}>
                  Format
                </label>
                <select 
                  value={outputFormat} 
                  onChange={(e) => setOutputFormat(e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    border: '1px solid #d4af37',
                    backgroundColor: '#ede8d3',
                    color: '#654321',
                    fontSize: '14px'
                  }}
                >
                  <option value="full">Full Sermon</option>
                  <option value="outline">Detailed Outline</option>
                  <option value="bullets">Bullet Points</option>
                  <option value="notes">Notes + Outline</option>
                </select>
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  // Update session memory as user types
                  if (e.target.value.length > 10) {
                    const lines = e.target.value.split('\n');
                    const firstLine = lines[0];
                    if (firstLine.length > 0) {
                      updateSessionMemory('theme', firstLine.substring(0, 50));
                    }
                  }
                }}
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
              {!inputText && (
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
                    Enter your sermon topic, scriptures, key points, and outline...
                    <br />
                    Or you can import them from the Study Hall page.
                  </div>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleGenerate}
                disabled={isLoading}
                style={{
                  padding: '14px 28px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#d4af37',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  opacity: isLoading ? 0.7 : 1,
                  transition: 'all 0.2s'
                }}
              >
                {isLoading ? 'Generating Sermon...' : 'Generate Sermon'}
              </button>
              <button
                onClick={handleClear}
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

          {/* Output Section */}
          <div style={{ backgroundColor: '#f4f1e8', padding: '24px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: '600', 
                margin: 0,
                color: '#654321'
              }}>
                Generated Sermon
              </h2>
              
              {/* Title and Export Controls - Now Persistent */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                {/* Editable Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isEditingTitle ? (
                    <input
                      type="text"
                      value={sermonTitle || 'Untitled Sermon'}
                      onChange={(e) => setSermonTitle(e.target.value)}
                      onBlur={() => setIsEditingTitle(false)}
                      onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                      style={{
                        fontSize: '16px',
                        fontWeight: '500',
                        color: '#654321',
                        border: '2px solid #d4af37',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        backgroundColor: '#ede8d3',
                        minWidth: '200px'
                      }}
                      autoFocus
                    />
                  ) : (
                    <span
                      onClick={() => setIsEditingTitle(true)}
                      style={{
                        fontSize: '16px',
                        fontWeight: '500',
                        color: '#654321',
                        cursor: 'pointer',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        backgroundColor: '#ede8d3',
                        border: '2px solid transparent',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      {sermonTitle || 'Untitled Sermon'}
                      <Edit3 size={14} style={{ color: '#8B4513' }} />
                    </span>
                  )}
                </div>
                
                {/* Edit/Preview Toggle */}
                <button
                  onClick={() => setIsPreviewMode(!isPreviewMode)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    border: '2px solid #d4af37',
                    backgroundColor: isPreviewMode ? '#d4af37' : 'transparent',
                    color: isPreviewMode ? '#000' : '#d4af37',
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    transition: 'all 0.2s',
                    fontWeight: '500'
                  }}
                  disabled={!generatedSermon}
                >
                  {isPreviewMode ? <Edit size={16} /> : <Eye size={16} />}
                  {isPreviewMode ? 'Edit' : 'Preview'}
                </button>
                
                {/* Save Button */}
                <button 
                  onClick={handleSave}
                  className="btn-primary flex items-center gap-2"
                  disabled={isSaving || !generatedSermon}
                >
                  {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
                
                {/* Export Dropdown */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowExportDropdown(!showExportDropdown)}
                    className="btn-secondary flex items-center gap-2"
                    disabled={!generatedSermon}
                  >
                    <Download size={16} />
                    Export
                    <ChevronDown size={16} />
                  </button>
                  
                  {showExportDropdown && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: '0',
                      marginTop: '4px',
                      backgroundColor: '#f4f1e8',
                      border: '2px solid #d4af37',
                      borderRadius: '6px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      zIndex: 1000,
                      minWidth: '120px'
                    }}>
                      <button
                        onClick={() => handleExport('txt')}
                        style={{
                          width: '100%',
                          padding: '8px 16px',
                          backgroundColor: 'transparent',
                          color: '#654321',
                          border: 'none',
                          fontSize: '14px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          borderBottom: '1px solid #d4af37'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#ede8d3'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        📄 Text (.txt)
                      </button>
                      <button
                        onClick={() => handleExport('word')}
                        style={{
                          width: '100%',
                          padding: '8px 16px',
                          backgroundColor: 'transparent',
                          color: '#654321',
                          border: 'none',
                          fontSize: '14px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          borderBottom: '1px solid #d4af37'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#ede8d3'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        📝 Word (.doc)
                      </button>
                      <button
                        onClick={() => handleExport('pdf')}
                        style={{
                          width: '100%',
                          padding: '8px 16px',
                          backgroundColor: 'transparent',
                          color: '#654321',
                          border: 'none',
                          fontSize: '14px',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                        onMouseOver={(e) => e.target.style.backgroundColor = '#ede8d3'}
                        onMouseOut={(e) => e.target.style.backgroundColor = 'transparent'}
                      >
                        📄 PDF (Print)
                      </button>
                    </div>
                  )}
                </div>
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
              position: 'relative',
              maxHeight: '70vh',
              overflowY: 'auto'
            }}>
              {(generatedSermon || editableContent) && !isLoading && !error && (
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
                      <MarkdownRenderer content={editableContent || generatedSermon || ''} />
                    </div>
                  ) : (
                    <textarea
                      value={editableContent || generatedSermon || ''}
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
                      placeholder="Your generated sermon will appear here and can be edited directly..."
                    />
                  )}
                </div>
              )}
              {!generatedSermon && !isLoading && !error && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  color: '#8B4513',
                  fontStyle: 'italic',
                  fontSize: '18px',
                  padding: '20px'
                }}>
                  <div>
                    Your complete sermon will appear here after generation.
                    <br />
                    The Librarian will create a sermon based on your choices for style, type, format, and length.
                  </div>
                </div>
              )}
              {error && (
                <div style={{ 
                  color: '#dc3545', 
                  backgroundColor: '#f8d7da',
                  padding: '12px',
                  borderRadius: '6px',
                  border: '1px solid #f5c6cb'
                }}>
                  <strong>Error:</strong> {error}
                </div>
              )}
              {isLoading && (
                <div style={{ 
                  color: '#d4af37',
                  textAlign: 'center',
                  fontSize: '16px',
                  paddingTop: '40px'
                }}>
                  <div style={{ marginBottom: '20px' }}>The Librarian is crafting your sermon...</div>
                  <div style={{ fontSize: '14px', color: '#c9b037' }}>
                    It will be based on your choices for style, type, format, and length.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Phase Development Info */}
        <div style={{ 
          marginTop: '40px', 
          padding: '20px',
          backgroundColor: 'rgba(139, 69, 19, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(139, 69, 19, 0.3)'
        }}>
          <h3 style={{ color: '#8B4513', marginTop: '0' }}>Memory System Development Phases</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', fontSize: '14px' }}>
            <div>
              <strong style={{ color: '#28a745' }}>✅ Phase 1: Session Memory</strong>
              <p style={{ margin: '5px 0', color: '#f4f1e8' }}>
                Currently active - tracks theme, audience, and key points during current session
              </p>
            </div>
            <div>
              <strong style={{ color: '#ffc107' }}>🔄 Phase 2: Short-term Memory</strong>
              <p style={{ margin: '5px 0', color: '#f4f1e8' }}>
                Coming next - remember recent sermons, topics, and congregation feedback across sessions
              </p>
            </div>
            <div>
              <strong style={{ color: '#17a2b8' }}>📚 Phase 3: Long-term Memory</strong>
              <p style={{ margin: '5px 0', color: '#f4f1e8' }}>
                Final phase - permanent knowledge graph of theological concepts, sermon history, and relationships
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer style={{ 
          marginTop: '40px', 
          paddingTop: '20px',
          borderTop: '2px solid rgba(212, 175, 55, 0.3)',
          textAlign: 'center', 
          color: '#c9b037',
          fontSize: '14px'
        }}>
          <p>Sermon Workshop with Intelligent Memory System • Phase 1: Session Memory Active</p>
          <p style={{ fontSize: '12px', marginTop: '5px' }}>
            Building towards comprehensive AI-powered pastoral tools with persistent learning
          </p>
        </footer>
      </div>

      {/* Save Confirmation Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">Save Sermon to Library</h3>
            <p className="text-gray-600 mb-4">
              This will save "<strong>{sermonTitle}</strong>" to your sermon library where you can access it later.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                    Saving...
                  </>
                ) : (
                  'Save to Library'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Success Message */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
            <div className="w-2 h-2 bg-green-600 rounded-full"></div>
          </div>
          Sermon saved successfully!
        </div>
      )}
    </div>
  );
};

export default SermonGenerator;