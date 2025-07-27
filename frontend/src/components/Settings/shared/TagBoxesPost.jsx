import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { socialMediaPlatforms } from '../../../constants/tagConstants';
import { apiService } from '../../../services/api';

const TagBoxesPost = ({ postTags = [], contentId, onPostTagsChange }) => {
  // State for current post tag selections (editable)
  const [currentPostTags, setCurrentPostTags] = useState(postTags);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [saving, setSaving] = useState(false);

  // Update current post tags when props change
  useEffect(() => {
    setCurrentPostTags(postTags);
    setHasChanges(false);
  }, [postTags]);

  const handleSlotClick = (slotIndex) => {
    // Only allow editing if we have contentId
    if (!contentId) return;
    
    // Toggle dropdown for this slot
    const slotKey = `post-${slotIndex}`;
    setActiveDropdown(activeDropdown === slotKey ? null : slotKey);
  };

  const handlePostTagSelect = (slotIndex, platformCode) => {
    const newPostTags = [...(currentPostTags || [])];
    
    if (platformCode) {
      // Add/replace platform at this slot
      newPostTags[slotIndex] = platformCode;
    } else {
      // Remove platform from this slot
      newPostTags.splice(slotIndex, 1);
    }
    
    // Clean and limit to 3
    const cleanedPostTags = newPostTags.filter(Boolean).slice(0, 3);
    
    console.log('Post tag selection:', {
      slot: slotIndex,
      platformCode,
      cleanedPostTags,
      count: cleanedPostTags.length
    });
    
    setCurrentPostTags(cleanedPostTags);
    setHasChanges(true);
    setActiveDropdown(null);
  };

  const handleSavePostTags = async () => {
    if (!contentId) return;
    
    setSaving(true);
    try {
      // Call API directly to save post_tags
      await apiService.updateContentPostTags(contentId, currentPostTags);
      
      // Call parent callback if provided
      if (onPostTagsChange) {
        onPostTagsChange(contentId, currentPostTags);
      }
      
      setHasChanges(false);
      console.log('Post tags saved successfully:', currentPostTags);
    } catch (error) {
      console.error('Failed to save post tags:', error);
    } finally {
      setSaving(false);
    }
  };

  const getAvailablePlatforms = (currentSlot) => {
    const usedPlatforms = (currentPostTags || []).filter((tag, index) => index !== currentSlot);
    return socialMediaPlatforms.filter(platform => !usedPlatforms.includes(platform.code));
  };

  return (
    <div className="relative">
      <div className="flex gap-1">
        {/* Post tag slots - exactly 3 */}
        {[0, 1, 2].map((slotIndex) => {
          const platformCode = currentPostTags && currentPostTags[slotIndex];
          const platform = platformCode ? socialMediaPlatforms.find(p => p.code === platformCode) : null;
          const isEmpty = !platform;
          const slotKey = `post-${slotIndex}`;
          const isDropdownOpen = activeDropdown === slotKey;
          const isEditable = !!contentId;
          
          return (
            <div key={slotKey} className="relative">
              <div
                onClick={() => handleSlotClick(slotIndex)}
                className={`
                  w-6 h-6 text-xs
                  rounded-full transition-all duration-200
                  ${isEmpty 
                    ? `bg-amber-800/30 text-amber-300 ${isEditable ? 'hover:bg-amber-800/50' : ''}` 
                    : `bg-amber-800 text-white ${isEditable ? 'hover:bg-amber-900' : ''}`
                  }
                  ${isEditable ? 'cursor-pointer' : 'cursor-default'}
                  text-center flex items-center justify-center
                  ${isDropdownOpen ? 'ring-2 ring-brass' : ''}
                `}
                title={
                  isEmpty 
                    ? (isEditable ? `Add post tag` : `Empty post tag slot`)
                    : `${platform.name} (${platform.code})${isEditable ? ' - Click to edit' : ''}`
                }
              >
                {isEmpty ? '+' : platform.code}
              </div>
              
              {/* Post Tag Selection Dropdown */}
              {isDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 bg-library-dark border border-brass/30 rounded-md shadow-lg z-50 min-w-[160px]">
                  <div className="p-2">
                    <div className="text-xs text-brass-light mb-2 font-medium">
                      Post Tags
                    </div>
                    <div className="max-h-40 overflow-y-auto">
                      {/* Remove current post tag option */}
                      {platform && (
                        <div
                          onClick={() => handlePostTagSelect(slotIndex, null)}
                          className="px-3 py-2 text-sm text-red-300 hover:bg-red-900/20 cursor-pointer rounded"
                        >
                          Remove "{platform.code}"
                        </div>
                      )}
                      
                      {/* Available post tags */}
                      {getAvailablePlatforms(slotIndex).map(availablePlatform => (
                        <div
                          key={availablePlatform.code}
                          onClick={() => handlePostTagSelect(slotIndex, availablePlatform.code)}
                          className={`
                            px-3 py-2 text-sm cursor-pointer rounded flex items-center gap-2
                            ${(currentPostTags || []).includes(availablePlatform.code) 
                              ? 'text-amber-300 bg-amber-900/20' 
                              : 'text-brass-light hover:bg-brass/10'
                            }
                          `}
                        >
                          <span className="bg-amber-800 text-white text-xs px-1 py-0.5 rounded-full min-w-6 text-center">
                            {availablePlatform.code}
                          </span>
                          {availablePlatform.name}
                          {(currentPostTags || []).includes(availablePlatform.code) && ' ✓'}
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
      
      {/* Save Post Tags Button */}
      {hasChanges && contentId && (
        <div className="mt-1 flex justify-center">
          <button
            onClick={handleSavePostTags}
            disabled={saving}
            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white rounded transition-colors duration-200 disabled:opacity-50 px-2 py-1 text-xs"
          >
            <Save className="w-3 h-3" />
            {saving ? 'Saving...' : 'Save Post Tags'}
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

export default TagBoxesPost;