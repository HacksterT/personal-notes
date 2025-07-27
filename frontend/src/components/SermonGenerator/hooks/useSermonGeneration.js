import { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';

export const useSermonGeneration = () => {
  const [generatedSermon, setGeneratedSermon] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sermonTitle, setSermonTitle] = useState('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [editableContent, setEditableContent] = useState('');
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Session memory for better context
  const [sessionMemory, setSessionMemory] = useState({
    theme: '',
    scriptures: [],
    audience: '',
    previousGenerations: []
  });

  // Load session data from localStorage
  useEffect(() => {
    try {
      const savedGeneratedSermon = localStorage.getItem('sermonGenerator_generatedSermon');
      const savedSermonTitle = localStorage.getItem('sermonGenerator_sermonTitle');
      const savedEditableContent = localStorage.getItem('sermonGenerator_editableContent');
      const savedSessionMemory = localStorage.getItem('sermonGenerator_sessionMemory');

      if (savedGeneratedSermon) setGeneratedSermon(savedGeneratedSermon);
      if (savedSermonTitle) setSermonTitle(savedSermonTitle);
      if (savedEditableContent) setEditableContent(savedEditableContent);
      if (savedSessionMemory) setSessionMemory(JSON.parse(savedSessionMemory));

      console.log('✅ Generation session data loaded');
    } catch (error) {
      console.error('Failed to load generation session data:', error);
    }
  }, []);

  // Auto-save generated content
  useEffect(() => {
    if (generatedSermon) {
      localStorage.setItem('sermonGenerator_generatedSermon', generatedSermon);
    }
  }, [generatedSermon]);

  useEffect(() => {
    if (sermonTitle) {
      localStorage.setItem('sermonGenerator_sermonTitle', sermonTitle);
    }
  }, [sermonTitle]);

  useEffect(() => {
    if (editableContent) {
      localStorage.setItem('sermonGenerator_editableContent', editableContent);
    }
  }, [editableContent]);

  useEffect(() => {
    localStorage.setItem('sermonGenerator_sessionMemory', JSON.stringify(sessionMemory));
  }, [sessionMemory]);

  // Update session memory
  const updateSessionMemory = (key, value) => {
    setSessionMemory(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Generate sermon using AI
  const handleGenerate = async (formData) => {
    const { inputText, sermonType, speakingStyle, sermonLength, outputFormat } = formData;

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
          case 'topical':
            return 'Develop a clear theme with supporting scriptures. Connect various passages that illuminate the topic.';
          case 'expository':
            return 'Work through the passage verse by verse. Explain the original meaning and apply to contemporary life.';
          case 'narrative':
            return 'Tell the biblical story with vivid detail. Draw parallels between biblical characters and modern believers.';
          case 'apologetic':
            return 'Address doubts and questions. Provide reasoned defense of the faith with biblical backing.';
          case 'practical':
            return 'Focus heavily on application. Give concrete, actionable steps for living out biblical truth.';
          default:
            return 'Create a biblically grounded message that teaches and applies Scripture.';
        }
      };

      // Enhanced context from session memory
      const sessionContext = sessionMemory.previousGenerations.length > 0 
        ? `\n\nPrevious session context:
- Theme focus: ${sessionMemory.theme}
- Scripture(s): ${sessionMemory.scriptures.join(', ')}
- Audience: ${sessionMemory.audience}
- Previous generations: ${sessionMemory.previousGenerations.length}`
        : '';

      const prompt = `You are an experienced pastor and homiletics expert. Generate a ${sermonType} sermon based on the provided notes.

**Content to develop:**
${inputText}

**Sermon specifications:**
- Type: ${sermonType} (${getTypeGuidance()})
- Style: ${speakingStyle} (${getStyleGuidance()})
- Length: ${getLengthGuidance()}
- Format: ${outputFormat}${getFormatInstructions()}

**Requirements:**
1. Create a compelling title that captures the main message
2. Include a strong introduction that hooks the audience
3. Develop main points with biblical support and practical application
4. Include relevant illustrations or examples
5. End with a clear call to action or response
6. Maintain theological accuracy and pastoral sensitivity
7. Write in a way that connects with contemporary audiences

${sessionContext}

Please generate the complete sermon now:`;

      console.log('🚀 Generating sermon with prompt:', prompt.substring(0, 200) + '...');

      // Call the API with the enhanced prompt
      const response = await apiService.generateSermon(prompt, {
        signal: controller.signal
      });

      if (response.success && response.sermon) {
        setGeneratedSermon(response.sermon);
        setEditableContent(response.sermon);
        
        // Extract title from generated content
        const titleMatch = response.sermon.match(/^#\s*(.+?)$/m);
        if (titleMatch) {
          setSermonTitle(titleMatch[1]);
        }

        // Add to session memory
        updateSessionMemory('previousGenerations', [
          ...sessionMemory.previousGenerations.slice(-2), // Keep last 2
          {
            prompt: inputText.substring(0, 100),
            timestamp: new Date().toISOString(),
            type: sermonType,
            style: speakingStyle
          }
        ]);

        console.log('✅ Sermon generated successfully');
      } else {
        throw new Error(response.error || 'Failed to generate sermon');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        setError('Request timed out after 2 minutes. Please try again with shorter input or check your connection.');
      } else {
        console.error('Sermon generation failed:', error);
        setError(`Generation failed: ${error.message || 'Unknown error occurred'}`);
      }
    } finally {
      clearTimeout(timeoutId);
      setIsLoading(false);
    }
  };

  // Handle content editing
  const handleStartEditing = () => {
    setIsEditingContent(true);
    setEditableContent(generatedSermon);
  };

  const handleSaveEdit = () => {
    setGeneratedSermon(editableContent);
    setIsEditingContent(false);
    console.log('✅ Content edits saved');
  };

  const handleCancelEdit = () => {
    setEditableContent(generatedSermon);
    setIsEditingContent(false);
  };

  // Handle title editing
  const handleTitleEdit = (newTitle) => {
    setSermonTitle(newTitle);
    setIsEditingTitle(false);
  };

  // Toggle preview mode
  const togglePreviewMode = () => {
    setIsPreviewMode(!isPreviewMode);
  };

  // Load editing sermon data
  const loadEditingSermon = (sermonData) => {
    if (sermonData) {
      setGeneratedSermon(sermonData.content || '');
      setEditableContent(sermonData.content || '');
      setSermonTitle(sermonData.title || '');
      console.log('✅ Editing sermon data loaded');
    }
  };

  // Clear generated content
  const handleClear = () => {
    setGeneratedSermon('');
    setEditableContent('');
    setSermonTitle('');
    setError('');
    setIsEditingContent(false);
    setIsEditingTitle(false);
    setIsPreviewMode(false);
    
    // Clear localStorage
    localStorage.removeItem('sermonGenerator_generatedSermon');
    localStorage.removeItem('sermonGenerator_sermonTitle');
    localStorage.removeItem('sermonGenerator_editableContent');
    
    console.log('✅ Generated content cleared');
  };

  return {
    // State
    generatedSermon,
    isLoading,
    error,
    sermonTitle,
    isEditingTitle,
    isEditingContent,
    editableContent,
    isPreviewMode,
    sessionMemory,

    // Actions
    handleGenerate,
    handleStartEditing,
    handleSaveEdit,
    handleCancelEdit,
    handleTitleEdit,
    togglePreviewMode,
    loadEditingSermon,
    handleClear,
    updateSessionMemory,

    // Setters
    setSermonTitle,
    setIsEditingTitle,
    setEditableContent,
    setError
  };
};