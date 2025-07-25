import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { tagCategories, organizeTagsByCategory, prescriptiveTags } from '../constants/tagConstants';

const TagBoxes = ({ tags = [], category, compact = false, contentId, onTagsChange }) => {
  // State for current tag selections (editable)
  const [currentTags, setCurrentTags] = useState(tags);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [saving, setSaving] = useState(false);

  // Update current tags when props change
  useEffect(() => {
    setCurrentTags(tags);
    setHasChanges(false);
  }, [tags]);

  // Organize current tags by category
  const organizedTags = organizeTagsByCategory(currentTags);
  
  // Create exactly 5 slots total with category distribution
  const createSlots = () => {
    const slots = [];
    
    // Slot distribution: Green(2) + Blue(1) + Orange(1) + Purple(1) = 5 total
    
    // Area of Focus (Green) - 2 slots
    for (let i = 0; i < 2; i++) {
      const tag = organizedTags.area_of_focus[i];
      slots.push({
        category: 'area_of_focus',
        tag: tag || null,
        index: i
      });
    }
    
    // Content Purpose (Blue) - 1 slot
    const contentTag = organizedTags.content_purpose[0];
    slots.push({
      category: 'content_purpose',
      tag: contentTag || null,
      index: 0
    });
    
    // Tone/Style (Orange) - 1 slot
    const toneTag = organizedTags.tone_style[0];
    slots.push({
      category: 'tone_style',
      tag: toneTag || null,
      index: 0
    });
    
    // Custom (Purple) - 1 slot
    const customTag = organizedTags.custom[0];
    slots.push({
      category: 'custom',
      tag: customTag || null,
      index: 0
    });
    
    return slots;
  };

  const slots = createSlots();

  const handleSlotClick = (slot) => {
    // Only allow editing if we have contentId and onTagsChange callback
    if (!contentId || !onTagsChange) return;
    
    // Toggle dropdown for this slot
    const slotKey = `${slot.category}-${slot.index}`;
    setActiveDropdown(activeDropdown === slotKey ? null : slotKey);
  };

  const handleTagSelect = (slot, newTag) => {
    // Create new tags array from current slots, but update the specific slot
    const newTagsArray = [];
    
    // Go through each slot and build the new tags array
    slots.forEach(currentSlot => {
      if (currentSlot.category === slot.category && currentSlot.index === slot.index) {
        // This is the slot we're updating
        if (newTag) {
          newTagsArray.push(newTag);
        }
        // If newTag is null/undefined, we don't add anything (removes the tag)
      } else {
        // Keep existing tag from this slot
        if (currentSlot.tag) {
          newTagsArray.push(currentSlot.tag);
        }
      }
    });
    
    // Ensure we never exceed 5 tags
    const finalTagsArray = newTagsArray.slice(0, 5);
    
    console.log('Tag selection:', {
      slot: `${slot.category}-${slot.index}`,
      newTag,
      finalTagsArray,
      count: finalTagsArray.length
    });
    
    setCurrentTags(finalTagsArray);
    setHasChanges(true);
    setActiveDropdown(null);
  };


  const handleSaveTags = async () => {
    if (!contentId || !onTagsChange) return;
    
    setSaving(true);
    try {
      // Call parent component's save function with regular tags
      await onTagsChange(contentId, currentTags);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save tags:', error);
      // Could add error toast here
    } finally {
      setSaving(false);
    }
  };

  const getAvailableTagsForCategory = (categoryKey) => {
    // Get prescriptive tags from constants
    let categoryTags = prescriptiveTags[categoryKey] || [];
    
    // For custom category, also load from localStorage
    if (categoryKey === 'custom') {
      try {
        const savedCustomTags = localStorage.getItem('customTags');
        const customTags = savedCustomTags ? JSON.parse(savedCustomTags) : [];
        categoryTags = [...categoryTags, ...customTags];
      } catch (error) {
        console.error('Failed to load custom tags from localStorage:', error);
      }
    }
    
    return categoryTags;
  };

  const truncateTag = (tagName, maxLength = compact ? 6 : 8) => {
    if (!tagName) return '';
    return tagName.length > maxLength ? tagName.substring(0, maxLength) + '...' : tagName;
  };



  return (
    <div className="relative">
      <div className={`flex gap-1 ${compact ? 'flex-wrap' : 'flex-nowrap'}`}>
        {/* Regular tag slots */}
        {slots.map((slot) => {
          const category = tagCategories[slot.category];
          const isEmpty = !slot.tag;
          const slotKey = `${slot.category}-${slot.index}`;
          const isDropdownOpen = activeDropdown === slotKey;
          const isEditable = contentId && onTagsChange;
          
          return (
            <div key={slotKey} className="relative">
              <div
                onClick={() => handleSlotClick(slot)}
                className={`
                  ${compact ? 'text-xs px-1 py-1' : 'text-xs px-1 py-1'} 
                  rounded transition-all duration-200
                  ${isEmpty 
                    ? `${category.colorClassLight} text-white ${isEditable ? 'hover:opacity-80' : ''}` 
                    : `${category.colorClass} text-white ${isEditable ? 'hover:opacity-90' : ''}`
                  }
                  ${compact ? 'w-12 max-w-12' : 'w-14 max-w-14'}
                  ${isEditable ? 'cursor-pointer' : 'cursor-default'}
                  text-center truncate
                  ${isDropdownOpen ? 'ring-2 ring-brass' : ''}
                `}
                title={
                  isEmpty 
                    ? (isEditable ? `Add ${category.name} tag` : `Empty ${category.name} slot`)
                    : `${slot.tag} (${category.name})${isEditable ? ' - Click to edit' : ''}`
                }
              >
                {isEmpty ? '+' : truncateTag(slot.tag)}
              </div>
              
              {/* Tag Selection Dropdown */}
              {isDropdownOpen && (
                <div className={`absolute top-full left-0 mt-1 bg-library-dark border border-brass/30 rounded-md shadow-lg z-50 ${compact ? 'min-w-[180px]' : 'min-w-[200px]'}`}>
                  <div className="p-2">
                    <div className="text-xs text-brass-light mb-2 font-medium">
                      {category.name}
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                      {/* Remove current tag option */}
                      {slot.tag && (
                        <div
                          onClick={() => handleTagSelect(slot, null)}
                          className="px-3 py-2 text-sm text-red-300 hover:bg-red-900/20 cursor-pointer rounded"
                        >
                          Remove "{slot.tag}"
                        </div>
                      )}
                      
                      {/* Available tags for this category */}
                      {getAvailableTagsForCategory(slot.category).map(tag => (
                        <div
                          key={tag}
                          onClick={() => handleTagSelect(slot, tag)}
                          className={`
                            px-3 py-2 text-sm cursor-pointer rounded
                            ${currentTags.includes(tag) 
                              ? 'text-brass bg-brass/10' 
                              : 'text-brass-light hover:bg-brass/10'
                            }
                          `}
                        >
                          {tag}
                          {currentTags.includes(tag) && ' ✓'}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Save Tags Button */}
      {hasChanges && contentId && onTagsChange && (
        <div className={`${compact ? 'mt-1' : 'mt-2'} flex justify-center`}>
          <button
            onClick={handleSaveTags}
            disabled={saving}
            className={`flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors duration-200 disabled:opacity-50 ${
              compact ? 'px-2 py-1 text-xs' : 'px-3 py-1 text-xs'
            }`}
          >
            <Save className="w-3 h-3" />
            {saving ? 'Saving...' : 'Save Tags'}
          </button>
        </div>
      )}
      
      {/* Click outside to close dropdown */}
      {activeDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setActiveDropdown(null)}
        />
      )}
    </div>
  );
};

export default TagBoxes;