import { useState, useEffect, useCallback } from 'react';
import { bibleService } from '../../../services/bibleService';

export const useBibleNavigation = (version = 'NLT') => {
  const [currentBook, setCurrentBook] = useState('John');
  const [currentChapter, setCurrentChapter] = useState(1);
  const [chapterData, setChapterData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load chapter data
  const loadChapter = useCallback(async (book, chapter) => {
    setLoading(true);
    setError(null);
    
    try {
      // Call real backend Bible service
      const data = await bibleService.getChapter(book, chapter, version);
      setChapterData(data);
    } catch (err) {
      setError(err.message || 'Failed to load chapter');
      console.error('Error loading chapter:', err);
    } finally {
      setLoading(false);
    }
  }, [version]);

  // Navigate to specific chapter
  const navigateToChapter = useCallback((book, chapter) => {
    setCurrentBook(book);
    setCurrentChapter(chapter);
  }, []);

  // Navigate to reference (e.g., "John 3:16")
  const navigateToReference = useCallback((reference) => {
    try {
      // Simple reference parsing - improve later
      const match = reference.match(/^(\d?\s?\w+)\s+(\d+)(?::(\d+))?/);
      if (match) {
        const book = match[1].trim();
        const chapter = parseInt(match[2]);
        setCurrentBook(book);
        setCurrentChapter(chapter);
      } else {
        throw new Error('Invalid reference format');
      }
    } catch (err) {
      setError('Invalid reference format. Use format like "John 3:16"');
    }
  }, []);

  // Load chapter when book/chapter changes
  useEffect(() => {
    loadChapter(currentBook, currentChapter);
  }, [currentBook, currentChapter, loadChapter]);

  return {
    currentBook,
    currentChapter,
    chapterData,
    loading,
    error,
    navigateToChapter,
    navigateToReference
  };
};