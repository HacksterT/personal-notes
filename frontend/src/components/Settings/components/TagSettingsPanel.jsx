import React from 'react';
import { Plus, Edit2, Trash2, Save, X } from 'lucide-react';

const TagSettingsPanel = ({
  // Content tag props
  contentTagData,
  onContentTagAdd,
  onContentTagEdit,
  onContentTagDelete,
  onStartContentTagEdit,
  onCancelContentTagEdit,
  onStartAddingContentTag,
  onCancelAddingContentTag,
  onSetNewContentTagName,
  
  // Social media tag props
  socialMediaData,
  onTogglePlatformStatus
}) => {
  const {
    tagLibrary,
    tagUsage,
    loading: contentLoading,
    editingTag,
    newTagCategory,
    newTagName,
    tagCategories,
    getTagUsageCount,
    getCategoryStats,
    getMostUsedTags
  } = contentTagData;

  const {
    platforms,
    platformUsage,
    loading: socialLoading,
    getPlatformUsageCount,
    getPlatformStats,
    getMostUsedPlatforms
  } = socialMediaData;

  if (contentLoading || socialLoading) {
    return <div className="text-brass-light">Loading tag library...</div>;
  }

  const categoryStats = getCategoryStats();
  const mostUsedTags = getMostUsedTags();
  const platformStats = getPlatformStats();
  const mostUsedPlatforms = getMostUsedPlatforms();

  return (
    <div>
      <h2 className="text-2xl font-cormorant text-brass mb-6">Tag Library Management</h2>
      
      {/* Overview Section */}
      <div className="mb-8 p-4 bg-library-dark/20 rounded-lg">
        <h3 className="text-lg font-semibold text-brass-light mb-3">Tag System Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-brass-light mb-2 font-medium">Content Tags</h4>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(tagCategories).map(([categoryKey, category]) => (
                <div key={categoryKey} className="text-center">
                  <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${category.colorClass} text-white mb-2`}>
                    {category.name}
                  </div>
                  <div className="text-xs text-brass-light/70">
                    <div>Limit: {category.limit} tags</div>
                    <div>{categoryStats[categoryKey]?.count || 0} tags</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-brass-light mb-2 font-medium">Social Media Platforms</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-brass-light/80">Active Platforms</span>
                <span className="text-brass">{platformStats.active}/{platformStats.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-brass-light/80">Total Posts</span>
                <span className="text-brass">{platformStats.totalUsage}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content Tags Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-brass-light mb-4">Content Tags</h3>
        
        {Object.entries(tagCategories).map(([categoryKey, category]) => (
          <div key={categoryKey} className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-brass-light flex items-center gap-2">
                <span className={`inline-block w-4 h-4 rounded-full bg-${category.color}-500`}></span>
                {category.name}
                <span className="text-sm text-brass-light/60">
                  ({tagLibrary[categoryKey]?.length || 0} tags, limit: {category.limit})
                </span>
              </h4>
              
              {/* Add Custom Tag Button (only for custom category) */}
              {categoryKey === 'custom' && (
                <div className="flex items-center gap-2">
                  {newTagCategory === categoryKey ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newTagName}
                        onChange={(e) => onSetNewContentTagName(e.target.value)}
                        placeholder="Enter custom tag name"
                        className="bg-library-dark border-brass/30 rounded px-2 py-1 text-sm text-brass-light focus:ring-brass focus:border-brass"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            onContentTagAdd(categoryKey);
                          } else if (e.key === 'Escape') {
                            onCancelAddingContentTag();
                          }
                        }}
                        autoFocus
                      />
                      <button
                        onClick={() => onContentTagAdd(categoryKey)}
                        className="text-green-400 hover:text-green-300"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={onCancelAddingContentTag}
                        className="text-red-400 hover:text-red-300"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => onStartAddingContentTag(categoryKey)}
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
              {(tagLibrary[categoryKey] || []).map((tagName, index) => (
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
                            onContentTagEdit(categoryKey, tagName, e.target.value);
                          } else if (e.key === 'Escape') {
                            onCancelContentTagEdit();
                          }
                        }}
                        onBlur={(e) => onContentTagEdit(categoryKey, tagName, e.target.value)}
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
                          onClick={() => onStartContentTagEdit(categoryKey, index)}
                          className="text-black/70 hover:text-black bg-white/20 hover:bg-white/30 rounded p-1"
                          title="Edit tag"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => onContentTagDelete(categoryKey, tagName)}
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
              {(!tagLibrary[categoryKey] || tagLibrary[categoryKey].length === 0) && (
                <div className="col-span-full text-center py-8 text-brass-light/60">
                  No tags in this category yet.
                  {categoryKey === 'custom' && ' Click "Add Custom Tag" to create your first custom tag.'}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Social Media Platforms Section */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-brass-light mb-4">Social Media Platforms</h3>
        
        <div className="p-6 bg-amber-900/30 rounded-lg border border-brass/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-amber-800"></div>
            <h4 className="text-lg font-semibold text-brass-light">Platform Tags</h4>
            <span className="text-sm text-brass-light/60">(Platform-specific tags for social media posts)</span>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {platforms.map((platform) => (
              <div 
                key={platform.code}
                className={`flex flex-col items-center p-3 rounded-lg border transition-all duration-200 cursor-pointer ${
                  platform.active 
                    ? 'bg-amber-900/50 border-amber-800/50 hover:bg-amber-900/70' 
                    : 'bg-gray-800/50 border-gray-700/50 hover:bg-gray-800/70'
                }`}
                onClick={() => onTogglePlatformStatus(platform.code)}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  platform.active ? 'bg-amber-800' : 'bg-gray-600'
                }`}>
                  <span className={`font-bold text-sm ${
                    platform.active ? 'text-amber-100' : 'text-gray-300'
                  }`}>
                    {platform.code}
                  </span>
                </div>
                <span className={`text-xs text-center ${
                  platform.active ? 'text-amber-200' : 'text-gray-400'
                }`}>
                  {platform.name}
                </span>
                <span className={`text-xs mt-1 ${
                  platform.active ? 'text-amber-300' : 'text-gray-500'
                }`}>
                  {getPlatformUsageCount(platform.code)} posts
                </span>
                {!platform.active && (
                  <span className="text-xs mt-1 text-red-400">Disabled</span>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 flex items-center justify-between p-3 bg-amber-900/20 rounded border border-amber-800/30">
            <div className="text-amber-200/80 text-sm">
              <strong>Platform Management:</strong> Click to enable/disable platforms
            </div>
            <div className="text-amber-200 text-sm font-medium">
              {platformStats.active} active platforms
            </div>
          </div>
        </div>
      </div>

      {/* Usage Statistics */}
      <div className="p-4 bg-library-dark/20 rounded-lg">
        <h3 className="text-lg font-semibold text-brass-light mb-3">Usage Statistics</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-brass-light mb-2">Most Used Content Tags</h4>
            <div className="space-y-1">
              {mostUsedTags.map(([tag, count]) => (
                <div key={tag} className="flex justify-between text-sm">
                  <span className="text-brass-light/80">{tag}</span>
                  <span className="text-brass">{count} items</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-brass-light mb-2">Most Used Platforms</h4>
            <div className="space-y-1">
              {mostUsedPlatforms.map(({ platform, count }) => (
                <div key={platform?.code} className="flex justify-between text-sm">
                  <span className="text-brass-light/80">{platform?.name}</span>
                  <span className="text-brass">{count} posts</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagSettingsPanel;