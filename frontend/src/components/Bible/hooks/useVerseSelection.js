import { useState, useCallback } from 'react';

export const useVerseSelection = () => {
  const [selectedVerses, setSelectedVerses] = useState(new Set());

  // Select or deselect a verse
  const selectVerse = useCallback((verseKey) => {
    setSelectedVerses(prev => {
      const newSet = new Set(prev);
      if (newSet.has(verseKey)) {
        newSet.delete(verseKey);
      } else {
        newSet.add(verseKey);
      }
      return newSet;
    });
  }, []);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedVerses(new Set());
  }, []);

  // Check if verse is selected
  const isVerseSelected = useCallback((verseKey) => {
    return selectedVerses.has(verseKey);
  }, [selectedVerses]);

  // Get selected text for copying/sharing
  const getSelectedText = useCallback((chapterData) => {
    if (!chapterData || selectedVerses.size === 0) return '';
    
    const selectedArray = Array.from(selectedVerses).sort((a, b) => {
      // Parse verse numbers from keys like "John.3.16"
      const aVerse = parseInt(a.split('.').pop());
      const bVerse = parseInt(b.split('.').pop());
      return aVerse - bVerse;
    });

    const verses = selectedArray.map(verseKey => {
      const verseNum = parseInt(verseKey.split('.').pop());
      const verse = chapterData.verses?.find(v => v.number === verseNum);
      if (verse) {
        return `${verseNum}. ${verse.text}`;
      }
      return '';
    }).filter(Boolean);

    if (verses.length === 0) return '';

    // Add reference header
    const reference = selectedArray.length === 1 
      ? selectedArray[0].replace(/\./g, ' ')
      : `${chapterData.book} ${chapterData.chapter}:${selectedArray.map(k => k.split('.').pop()).join(',')}`;

    return `${reference} (${chapterData.version})\n\n${verses.join('\n')}`;
  }, [selectedVerses]);

  // Select a range of verses
  const selectRange = useCallback((startVerse, endVerse, book, chapter) => {
    const start = Math.min(startVerse, endVerse);
    const end = Math.max(startVerse, endVerse);
    
    setSelectedVerses(prev => {
      const newSet = new Set(prev);
      for (let i = start; i <= end; i++) {
        newSet.add(`${book}.${chapter}.${i}`);
      }
      return newSet;
    });
  }, []);

  return {
    selectedVerses,
    selectVerse,
    clearSelection,
    isVerseSelected,
    getSelectedText,
    selectRange
  };
};