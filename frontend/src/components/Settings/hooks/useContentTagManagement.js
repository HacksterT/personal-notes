import { useState, useEffect } from 'react';
import { tagCategories, prescriptiveTags } from '../../../constants/tagConstants';

export const useContentTagManagement = () => {
  // Load custom tags from localStorage
  const loadCustomTags = () => {
    try {
      const saved = localStorage.getItem('customTags');
      return saved ? JSON.parse(saved) : [];
    } catch (error) {
      console.error('Failed to load custom tags from localStorage:', error);
      return [];
    }
  };

  // Initialize with prescriptive tags + custom tags from localStorage
  const initialTags = {
    ...prescriptiveTags,
    custom: loadCustomTags()
  };

  // State management
  const [tagLibrary, setTagLibrary] = useState(initialTags);
  const [tagUsage, setTagUsage] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingTag, setEditingTag] = useState(null);
  const [newTagCategory, setNewTagCategory] = useState('');
  const [newTagName, setNewTagName] = useState('');

  // Load tag data and usage statistics
  useEffect(() => {
    loadTagData();
  }, []);

  // Save custom tags to localStorage
  const saveCustomTags = (customTags) => {
    try {
      localStorage.setItem('customTags', JSON.stringify(customTags));
      console.log('Custom tags saved to localStorage:', customTags);
    } catch (error) {
      console.error('Failed to save custom tags to localStorage:', error);
    }
  };

  // Load existing tags and usage statistics
  const loadTagData = async () => {
    setLoading(true);
    
    try {
      // TODO: Implement API calls to get existing tags and usage
      // For now, simulate with mock data
      console.log('Loading tag data...');
      
      // Simulate tag usage statistics
      const mockUsage = {
        'salvation & grace': 15,
        'prayer & worship': 12,
        'faith & trust': 8,
        'teaching & education': 6,
        'personal reflection': 9,
        'expository & scholarly': 4,
        'example custom tag': 2,
        // Social Media Platform Tags
        'FB': 5,
        'IG': 8,
        'X': 3,
        'LI': 2,
        'TT': 6,
        'YT': 4
      };
      setTagUsage(mockUsage);
      
      console.log('✅ Tag data loaded successfully');
    } catch (error) {
      console.error('Error loading tag data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add new custom tag
  const handleAddTag = (categoryKey) => {
    if (newTagName.trim() && categoryKey === 'custom') {
      const updatedLibrary = { ...tagLibrary };
      const trimmedName = newTagName.trim();
      
      // Check for duplicates (case-insensitive)
      const isDuplicate = updatedLibrary[categoryKey].some(
        tag => tag.toLowerCase() === trimmedName.toLowerCase()
      );
      
      if (!isDuplicate) {
        updatedLibrary[categoryKey].push(trimmedName);
        setTagLibrary(updatedLibrary);
        
        // Save custom tags to localStorage
        saveCustomTags(updatedLibrary[categoryKey]);
        
        setNewTagName('');
        setNewTagCategory('');
        
        // Update usage statistics for new tag
        const updatedUsage = { ...tagUsage };
        updatedUsage[trimmedName.toLowerCase()] = 0;
        setTagUsage(updatedUsage);
        
        console.log(`Added new custom tag: ${trimmedName}`);
        return { success: true, message: `Successfully added custom tag: "${trimmedName}"` };
      } else {
        return { success: false, message: `Tag "${trimmedName}" already exists in the Custom category.` };
      }
    } else if (!newTagName.trim()) {
      return { success: false, message: 'Please enter a tag name.' };
    }
    return { success: false, message: 'Invalid operation.' };
  };

  // Edit existing tag
  const handleEditTag = (categoryKey, oldName, newName) => {
    const trimmedNewName = newName.trim();
    
    if (trimmedNewName && trimmedNewName !== oldName) {
      const updatedLibrary = { ...tagLibrary };
      
      // Check for duplicates (case-insensitive)
      const isDuplicate = updatedLibrary[categoryKey].some(
        tag => tag.toLowerCase() === trimmedNewName.toLowerCase() && tag !== oldName
      );
      
      if (!isDuplicate) {
        const tagIndex = updatedLibrary[categoryKey].indexOf(oldName);
        if (tagIndex !== -1) {
          updatedLibrary[categoryKey][tagIndex] = trimmedNewName;
          setTagLibrary(updatedLibrary);
          
          // Save custom tags to localStorage (only if editing custom category)
          if (categoryKey === 'custom') {
            saveCustomTags(updatedLibrary[categoryKey]);
          }
          
          // Update usage statistics
          const updatedUsage = { ...tagUsage };
          if (updatedUsage[oldName.toLowerCase()]) {
            updatedUsage[trimmedNewName.toLowerCase()] = updatedUsage[oldName.toLowerCase()];
            delete updatedUsage[oldName.toLowerCase()];
            setTagUsage(updatedUsage);
          }
          
          console.log(`Renamed tag: ${oldName} → ${trimmedNewName}`);
          return { success: true, message: `Successfully renamed tag: "${oldName}" to "${trimmedNewName}"` };
        }
      } else {
        const categoryName = tagCategories[categoryKey]?.name || categoryKey;
        return { success: false, message: `Tag "${trimmedNewName}" already exists in the ${categoryName} category.` };
      }
    }
    setEditingTag(null);
    return { success: true, message: '' };
  };

  // Delete tag
  const handleDeleteTag = (categoryKey, tagName) => {
    const usageCount = getTagUsageCount(tagName);
    const confirmMessage = usageCount > 0 
      ? `Delete tag "${tagName}"? This tag is currently used in ${usageCount} content items and will be removed from all of them.`
      : `Delete tag "${tagName}"?`;
      
    if (window.confirm(confirmMessage)) {
      const updatedLibrary = { ...tagLibrary };
      updatedLibrary[categoryKey] = updatedLibrary[categoryKey].filter(tag => tag !== tagName);
      setTagLibrary(updatedLibrary);
      
      // Save custom tags to localStorage (only if deleting from custom category)
      if (categoryKey === 'custom') {
        saveCustomTags(updatedLibrary[categoryKey]);
      }
      
      // Remove from usage statistics
      const updatedUsage = { ...tagUsage };
      delete updatedUsage[tagName.toLowerCase()];
      setTagUsage(updatedUsage);
      
      console.log(`Deleted tag: ${tagName}`);
      return { success: true, message: `Successfully deleted tag: "${tagName}"` };
    }
    return { success: false, message: 'Deletion cancelled' };
  };

  // Get tag usage count
  const getTagUsageCount = (tagName) => {
    return tagUsage[tagName.toLowerCase()] || 0;
  };

  // Start editing a tag
  const startEditingTag = (categoryKey, index) => {
    setEditingTag(`${categoryKey}-${index}`);
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingTag(null);
  };

  // Start adding a new tag
  const startAddingTag = (categoryKey) => {
    setNewTagCategory(categoryKey);
    setNewTagName('');
  };

  // Cancel adding a new tag
  const cancelAddingTag = () => {
    setNewTagCategory('');
    setNewTagName('');
  };

  // Get category statistics
  const getCategoryStats = () => {
    const stats = {};
    Object.entries(tagCategories).forEach(([key, category]) => {
      stats[key] = {
        name: category.name,
        count: tagLibrary[key]?.length || 0,
        limit: category.limit
      };
    });
    return stats;
  };

  // Get most used tags
  const getMostUsedTags = (limit = 5) => {
    return Object.entries(tagUsage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit);
  };

  return {
    // State
    tagLibrary,
    tagUsage,
    loading,
    editingTag,
    newTagCategory,
    newTagName,
    tagCategories,
    
    // Handlers
    handleAddTag,
    handleEditTag,
    handleDeleteTag,
    startEditingTag,
    cancelEditing,
    startAddingTag,
    cancelAddingTag,
    setNewTagName,
    
    // Utilities
    getTagUsageCount,
    getCategoryStats,
    getMostUsedTags,
    loadTagData,
    saveCustomTags,
    
    // Setters for external control
    setTagLibrary,
    setTagUsage,
    setEditingTag
  };
};