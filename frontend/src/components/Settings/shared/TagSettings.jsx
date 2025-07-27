import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { tagCategories, prescriptiveTags } from '../../../constants/tagConstants';

const TagSettings = () => {
  // Import tag categories and prescriptive tags from constants
  // Use existing color classes from constants
  const tagCategoriesWithStyling = tagCategories;

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

  const [tagLibrary, setTagLibrary] = useState(initialTags);
  const [tagUsage, setTagUsage] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingTag, setEditingTag] = useState(null);
  const [newTagCategory, setNewTagCategory] = useState('');
  const [newTagName, setNewTagName] = useState('');

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
  useEffect(() => {
    const loadTagData = async () => {
      try {
        // TODO: Implement API calls to get existing tags and usage
        // For now, simulate with prescriptive tags
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
        
      } catch (error) {
        console.error('Error loading tag data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTagData();
  }, []);

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
        alert(`Successfully added custom tag: "${trimmedName}"`);
      } else {
        alert(`Tag "${trimmedName}" already exists in the Custom category.`);
      }
    } else if (!newTagName.trim()) {
      alert('Please enter a tag name.');
    }
  };

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
          
          // Update usage statistics
          const updatedUsage = { ...tagUsage };
          if (updatedUsage[oldName.toLowerCase()]) {
            updatedUsage[trimmedNewName.toLowerCase()] = updatedUsage[oldName.toLowerCase()];
            delete updatedUsage[oldName.toLowerCase()];
            setTagUsage(updatedUsage);
          }
          
          console.log(`Renamed tag: ${oldName} → ${trimmedNewName}`);
          alert(`Successfully renamed tag: "${oldName}" to "${trimmedNewName}"`);
        }
      } else {
        alert(`Tag "${trimmedNewName}" already exists in the ${tagCategoriesWithStyling[categoryKey].name} category.`);
      }
    }
    setEditingTag(null);
  };

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
      alert(`Successfully deleted tag: "${tagName}"`);
    }
  };

  const getTagUsageCount = (tagName) => {
    return tagUsage[tagName.toLowerCase()] || 0;
  };

  if (loading) {
    return <div className="text-brass-light">Loading tag library...</div>;
  }

  return (
    <div>
      <h2 className="text-2xl font-cormorant text-brass mb-6">Tag Library Management</h2>
      
      {/* Category Overview */}
      <div className="mb-8 p-4 bg-library-dark/20 rounded-lg">
        <h3 className="text-lg font-semibold text-brass-light mb-3">Tag Category System</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Object.entries(tagCategoriesWithStyling).map(([categoryKey, category]) => (
            <div key={categoryKey} className="text-center">
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${category.colorClass} text-white mb-2`}>
                {category.name}
              </div>
              <div className="text-xs text-brass-light/70">
                <div>Limit: {category.limit} tags</div>
                <div>{category.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tag Categories */}
      {Object.entries(tagCategoriesWithStyling).map(([categoryKey, category]) => (
        <div key={categoryKey} className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-brass-light flex items-center gap-2">
              <span className={`inline-block w-4 h-4 rounded-full bg-${category.color}-500`}></span>
              {category.name}
              <span className="text-sm text-brass-light/60">
                ({tagLibrary[categoryKey].length} tags, limit: {category.limit})
              </span>
            </h3>
            
            {/* Add Custom Tag Button (only for custom category) */}
            {categoryKey === 'custom' && (
              <div className="flex items-center gap-2">
                {newTagCategory === categoryKey ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newTagName}
                      onChange={(e) => setNewTagName(e.target.value)}
                      placeholder="Enter custom tag name"
                      className="bg-library-dark border-brass/30 rounded px-2 py-1 text-sm text-brass-light focus:ring-brass focus:border-brass"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag(categoryKey);
                        } else if (e.key === 'Escape') {
                          setNewTagCategory('');
                          setNewTagName('');
                        }
                      }}
                      autoFocus
                    />
                    <button
                      onClick={() => handleAddTag(categoryKey)}
                      className="text-green-400 hover:text-green-300"
                    >
                      <Save className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setNewTagCategory('');
                        setNewTagName('');
                      }}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setNewTagCategory(categoryKey)}
                    className="flex items-center gap-1 text-brass-light hover:text-brass text-sm"
                  >
                    <Plus className="w-4 h-4" /> Add Custom Tag
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Tag List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {tagLibrary[categoryKey].map((tagName, index) => (
              <div
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${category.colorClass} text-white`}
              >
                <div className="flex-1">
                  {editingTag === `${categoryKey}-${index}` ? (
                    <input
                      type="text"
                      defaultValue={tagName}
                      className="bg-transparent border-none text-inherit w-full focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleEditTag(categoryKey, tagName, e.target.value);
                        } else if (e.key === 'Escape') {
                          setEditingTag(null);
                        }
                      }}
                      onBlur={(e) => handleEditTag(categoryKey, tagName, e.target.value)}
                      autoFocus
                    />
                  ) : (
                    <div>
                      <div className="font-medium">{tagName}</div>
                      <div className="text-xs opacity-70">
                        Used in {getTagUsageCount(tagName)} items
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Tag Actions */}
                <div className="flex items-center gap-1 ml-2">
                  {categoryKey === 'custom' && (
                    <>
                      <button
                        onClick={() => setEditingTag(`${categoryKey}-${index}`)}
                        className="text-black/70 hover:text-black bg-white/20 hover:bg-white/30 rounded p-1"
                        title="Edit tag"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDeleteTag(categoryKey, tagName)}
                        className="text-black/70 hover:text-red-800 bg-white/20 hover:bg-red-100 rounded p-1"
                        title="Delete tag"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
            
            {/* Empty State */}
            {tagLibrary[categoryKey].length === 0 && (
              <div className="col-span-full text-center py-8 text-brass-light/60">
                No tags in this category yet.
                {categoryKey === 'custom' && ' Click "Add Custom Tag" to create your first custom tag.'}
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Social Media Tags Section */}
      <div className="mt-8 p-6 bg-amber-900/30 rounded-lg border border-brass/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-3 h-3 rounded-full bg-amber-800"></div>
          <h3 className="text-xl font-semibold text-brass-light">Social Media Tags</h3>
          <span className="text-sm text-brass-light/60">(Platform-specific tags for social media posts)</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { code: 'FB', name: 'Facebook' },
            { code: 'IG', name: 'Instagram' },
            { code: 'X', name: 'Twitter/X' },
            { code: 'LI', name: 'LinkedIn' },
            { code: 'TT', name: 'TikTok' },
            { code: 'YT', name: 'YouTube' }
          ].map((platform) => (
            <div 
              key={platform.code}
              className="flex flex-col items-center p-3 bg-amber-900/50 rounded-lg border border-amber-800/50 hover:bg-amber-900/70 transition-colors duration-200"
            >
              <div className="w-10 h-10 bg-amber-800 rounded-full flex items-center justify-center mb-2">
                <span className="text-amber-100 font-bold text-sm">{platform.code}</span>
              </div>
              <span className="text-amber-200 text-xs text-center">{platform.name}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-4 flex items-center justify-between p-3 bg-amber-900/20 rounded border border-amber-800/30">
          <div className="text-amber-200/80 text-sm">
            <strong>Platform Tags:</strong> Available for social media posts
          </div>
          <div className="text-amber-200 text-sm font-medium">
            6 tags active
          </div>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="mt-8 p-4 bg-library-dark/20 rounded-lg">
        <h3 className="text-lg font-semibold text-brass-light mb-3">Tag Usage Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-brass-light mb-2">Most Used Tags</h4>
            <div className="space-y-1">
              {Object.entries(tagUsage)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 5)
                .map(([tag, count]) => (
                  <div key={tag} className="flex justify-between text-sm">
                    <span className="text-brass-light/80">{tag}</span>
                    <span className="text-brass">{count} items</span>
                  </div>
                ))}
            </div>
          </div>
          <div>
            <h4 className="text-brass-light mb-2">Category Distribution</h4>
            <div className="space-y-1">
              {Object.entries(tagCategoriesWithStyling).map(([key, category]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-brass-light/80">{category.name}</span>
                  <span className="text-brass">{tagLibrary[key].length} tags</span>
                </div>
              ))}
              <div className="flex justify-between text-sm">
                <span className="text-brass-light/80">Social Media Tags</span>
                <span className="text-brass">6 tags</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagSettings;