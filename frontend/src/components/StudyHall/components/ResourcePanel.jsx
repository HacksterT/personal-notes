import React from 'react';
import { FileText, Filter } from 'lucide-react';
import TagBoxes from '../../TagBoxes';

const ResourcePanel = ({
  selectedResources,
  availableResources,
  filteredResources,
  resourceFilter,
  viewingResourceIndex,
  setResourceFilter,
  setViewingResourceIndex,
  onResourceSelect,
  onRemoveResource
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* Active Resources Section */}
      <div className="p-4 border-b border-brass/30 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-cormorant text-brass">Active Resources</h4>
          <div className="flex items-center gap-4 text-xs text-brass-light">
            <span>View</span>
            <span>Remove</span>
          </div>
        </div>
        
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map(index => {
            const resource = selectedResources[index];
            return (
              <div key={index} className="flex items-center gap-2">
                <div className={`flex-1 p-2 rounded text-sm ${
                  resource 
                    ? 'bg-brass/10 border border-brass/30' 
                    : 'bg-cream/30 border border-brass/20 opacity-50'
                }`} style={{ maxWidth: 'calc(100% - 70px)' }}>
                  <div className="font-medium text-cream text-xs truncate">
                    {resource ? resource.title : `Slot ${index + 1} - Empty`}
                  </div>
                  {resource && (
                    <div className="text-cream/70 text-xs mt-1">
                      {resource.category}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="viewResource"
                    value={index}
                    checked={viewingResourceIndex === index}
                    onChange={() => setViewingResourceIndex(index)}
                    disabled={!resource}
                    className="text-brass focus:ring-brass disabled:opacity-30"
                  />
                  <button
                    onClick={() => {
                      if (resource) {
                        onRemoveResource(index);
                      }
                    }}
                    disabled={!resource}
                    className="text-brass-light hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed p-1"
                    title="Remove resource"
                  >
                    ×
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resource Viewer Section */}
      <div className="flex-1 p-4 border-b border-brass/30 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-cormorant text-brass flex items-center gap-2">
            📖 Resource Viewer
          </h3>
          {/* Tags Display */}
          {viewingResourceIndex !== null && selectedResources[viewingResourceIndex] && (
            <TagBoxes
              tags={selectedResources[viewingResourceIndex].tags || []}
              compact={true}
            />
          )}
        </div>
        {viewingResourceIndex !== null && selectedResources[viewingResourceIndex] ? (
          <div className="bg-white/90 rounded-lg p-4 max-h-80 overflow-y-auto">
            <div className="border-b border-brass/20 pb-3 mb-4">
              <h4 className="font-cormorant font-semibold text-library-dark text-lg">
                {selectedResources[viewingResourceIndex].title}
              </h4>
              <div className="flex items-center gap-4 text-sm text-wood-dark/70 mt-1">
                <span className="capitalize">{selectedResources[viewingResourceIndex].category}</span>
                <span>{selectedResources[viewingResourceIndex].size}</span>
                {selectedResources[viewingResourceIndex].date_modified && (
                  <span>{new Date(selectedResources[viewingResourceIndex].date_modified).toLocaleDateString()}</span>
                )}
              </div>
            </div>
            <div className="text-library-dark leading-relaxed text-sm whitespace-pre-wrap">
              {selectedResources[viewingResourceIndex].content || 'No content available for this resource.'}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4 opacity-60">📄</div>
            <p className="text-library-dark/70 italic">
              No resource selected
            </p>
            <p className="text-library-dark/60 text-sm mt-2">
              Select a resource from Active Resources above to view its content here while working on your study.
            </p>
          </div>
        )}
      </div>

      {/* Library Resources Section */}
      <div className="bg-library-brown/10 flex-shrink-0">
        <div className="px-2 pt-1 pb-0">
          <h4 className="text-base font-cormorant text-brass mb-1 flex items-center gap-2">
            <FileText size={16} />
            Library Resources
          </h4>
          
          {/* Filter */}
          <div className="mb-1">
            <select 
              value={resourceFilter}
              onChange={(e) => setResourceFilter(e.target.value)}
              className="w-full text-xs p-2 bg-cream/90 border border-brass/30 rounded text-library-dark"
            >
              <option value="all">All Resources</option>
              <option value="sermons">Sermons</option>
              <option value="study-notes">Study Notes</option>
              <option value="research">Research</option>
              <option value="journal">Journal</option>
              <option value="social-media-posts">Social Media Posts</option>
            </select>
          </div>

          {/* Available Resources */}
          <div className="max-h-44 overflow-y-auto library-scrollbar space-y-1">
            {filteredResources.map(resource => (
              <div 
                key={resource.id}
                onClick={() => onResourceSelect(resource)}
                className={`p-2 rounded cursor-pointer text-xs transition-colors duration-200 ${
                  selectedResources.find(r => r.id === resource.id)
                    ? 'bg-brass/20 border border-brass/50' 
                    : 'bg-cream/80 hover:bg-cream border border-brass/20'
                }`}
              >
                <div className="font-medium text-library-dark truncate">
                  {resource.title}
                </div>
                <div className="text-wood-dark opacity-70">
                  {resource.category} • {resource.size}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourcePanel;