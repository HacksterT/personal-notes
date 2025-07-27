import { useState, useEffect } from 'react';

export const useSermonForm = () => {
  const [inputText, setInputText] = useState('');
  const [sermonType, setSermonType] = useState('topical');
  const [speakingStyle, setSpeakingStyle] = useState('conversational');
  const [sermonLength, setSermonLength] = useState('20-25');
  const [outputFormat, setOutputFormat] = useState('full');

  // Templates for different sermon types
  const templates = {
    topical: `*Scripture:* Matthew 6:25-34
*Title:* Finding Peace in God's Provision
*Theme:* Trust and Anxiety

**Main Points:**
1. Acknowledge our worries (v. 25-30)
2. Remember God's faithfulness (v. 26-30)
3. Seek first His kingdom (v. 31-33)
4. Live one day at a time (v. 34)

**Practical Application:**
- Start each day with prayer about your concerns
- Keep a gratitude journal of God's provision
- Practice the discipline of "leaving tomorrow for tomorrow"

**Discussion Questions:**
- What are you most anxious about today?
- How has God provided for you in the past?
- What does "seeking first the kingdom" look like practically?`,

    expository: `*Scripture:* Philippians 4:10-20
*Title:* Contentment in Every Circumstance
*Series:* Letters from Prison

**Context:** Paul writes from prison to thank the Philippians for their gift

**Verse-by-verse exposition:**
- v. 10-11: Paul's rejoicing and contentment
- v. 12-13: The secret of being content
- v. 14-16: Partnership in the gospel
- v. 17-18: Fruit that increases to your credit
- v. 19-20: God's glorious riches

**Key theological themes:**
- Divine contentment vs. worldly satisfaction
- Partnership in ministry
- God's faithful provision

**Application:**
- Learning contentment as a skill
- Supporting gospel ministry
- Trusting God's provision`,

    narrative: `*Scripture:* Luke 15:11-32
*Title:* The Story of Two Sons
*Theme:* Grace, Forgiveness, and Family

**The Setting:** Jesus tells this parable to religious leaders who criticized Him for eating with sinners.

**Character Analysis:**
- The Younger Son: rebellion, repentance, restoration
- The Father: patient love, eager forgiveness, generous grace
- The Older Son: duty without joy, anger at grace, missing the celebration

**The Heart of the Story:**
This isn't just about a prodigal son—it's about a gracious Father who runs to welcome home both the rebellious and the religious.

**Personal Reflection:**
- Which son are you today?
- How do you respond to God's grace toward others?
- What does it mean to truly come home?

Discussion questions for small groups:
- Which character do you most identify with?
- How have you experienced the Father's love?`
  };

  // Load template
  const loadTemplate = (type) => {
    setInputText(templates[type]);
  };

  // Load curated content from StudyHall
  const loadCuratedContent = () => {
    try {
      const storedContent = localStorage.getItem('curatedSermonContent');
      if (storedContent) {
        const content = JSON.parse(storedContent);
        console.log('📋 Loading curated content from Study Hall:', content);
        
        // Build input text from curated content
        let inputFromCuration = '';
        
        if (content.mainContent) {
          inputFromCuration += `**Curated Study Content:**\n\n${content.mainContent}\n\n`;
        }
        
        if (content.activeResourceThemes && content.activeResourceThemes.length > 0) {
          inputFromCuration += `**Related Themes from Active Resources:**\n\n`;
          content.activeResourceThemes.forEach(resource => {
            if (resource.themes && resource.themes.length > 0) {
              inputFromCuration += `*${resource.title}* (${resource.category}):\n`;
              resource.themes.forEach(theme => {
                inputFromCuration += `- ${theme}\n`;
              });
              inputFromCuration += '\n';
            }
          });
        }
        
        if (content.sourceDocument) {
          inputFromCuration += `*Source:* ${content.sourceDocument}\n`;
          inputFromCuration += `*Curated on:* ${new Date(content.timestamp).toLocaleDateString()}\n\n`;
        }
        
        inputFromCuration += `---\n\n**Sermon Development:**\n\n*Scripture:* \n*Title:* \n*Main Points:*\n1. \n2. \n3. \n\n*Application:*\n\n*Discussion Questions:*\n- \n- `;
        
        setInputText(inputFromCuration);
        
        // Clear the stored content to prevent reload on refresh
        localStorage.removeItem('curatedSermonContent');
        
        console.log('✅ Curated content loaded into sermon generator');
      }
    } catch (error) {
      console.error('Failed to load curated content:', error);
    }
  };

  // Load editing sermon from LibraryStacks
  const loadEditingSermon = () => {
    try {
      const editingSermon = localStorage.getItem('editingSermon');
      if (editingSermon) {
        const sermon = JSON.parse(editingSermon);
        console.log('📝 Loading sermon for editing:', sermon.title);
        
        setInputText(sermon.prompt || '');
        // Note: generatedSermon will be set by the generation hook
        
        // Clear the stored content
        localStorage.removeItem('editingSermon');
        
        console.log('✅ Editing sermon loaded');
      }
    } catch (error) {
      console.error('Failed to load editing sermon:', error);
    }
  };

  // Load session data from localStorage
  const loadSessionData = () => {
    try {
      const savedInputText = localStorage.getItem('sermonGenerator_inputText');
      const savedSermonType = localStorage.getItem('sermonGenerator_sermonType');
      const savedSpeakingStyle = localStorage.getItem('sermonGenerator_speakingStyle');
      const savedSermonLength = localStorage.getItem('sermonGenerator_sermonLength');
      const savedOutputFormat = localStorage.getItem('sermonGenerator_outputFormat');
      
      if (savedInputText) setInputText(savedInputText);
      if (savedSermonType) setSermonType(savedSermonType);
      if (savedSpeakingStyle) setSpeakingStyle(savedSpeakingStyle);
      if (savedSermonLength) setSermonLength(savedSermonLength);
      if (savedOutputFormat) setOutputFormat(savedOutputFormat);
      
      console.log('✅ Session data loaded from localStorage');
    } catch (error) {
      console.error('Failed to load session data:', error);
    }
  };

  // Save session data to localStorage
  const saveSessionData = () => {
    try {
      localStorage.setItem('sermonGenerator_inputText', inputText);
      localStorage.setItem('sermonGenerator_sermonType', sermonType);
      localStorage.setItem('sermonGenerator_speakingStyle', speakingStyle);
      localStorage.setItem('sermonGenerator_sermonLength', sermonLength);
      localStorage.setItem('sermonGenerator_outputFormat', outputFormat);
    } catch (error) {
      console.error('Failed to save session data:', error);
    }
  };

  // Auto-save session data when form changes
  useEffect(() => {
    const timeoutId = setTimeout(saveSessionData, 1000);
    return () => clearTimeout(timeoutId);
  }, [inputText, sermonType, speakingStyle, sermonLength, outputFormat]);

  // Load initial data on mount
  useEffect(() => {
    loadSessionData();
    loadCuratedContent();
    loadEditingSermon();
  }, []);

  // Clear form data
  const handleClear = () => {
    setInputText('');
    // Clear session storage
    localStorage.removeItem('sermonGenerator_inputText');
    console.log('✅ Form cleared');
  };

  return {
    // State
    inputText,
    sermonType,
    speakingStyle,
    sermonLength,
    outputFormat,
    templates,

    // Actions
    setInputText,
    setSermonType,
    setSpeakingStyle,
    setSermonLength,
    setOutputFormat,
    loadTemplate,
    loadCuratedContent,
    loadEditingSermon,
    handleClear,
    saveSessionData,
    loadSessionData
  };
};