/**
 * ResourcePanel - Left Panel Component for StudyHall
 * 
 * PURPOSE: Manages the 5-slot Active Resources system and Library Resources selection
 * LOCATION: Left column of StudyHall layout
 * 
 * FUNCTIONALITY:
 * 1. Active Resources (Top): 5-slot container for currently selected resources
 *    - Radio buttons to select which resource to VIEW in middle panel Resource Viewer
 *    - Remove buttons (×) to clear resources from slots
 *    - Shows resource title and category for each slot
 * 
 * 2. Library Resources (Bottom): Resource selection from user's library
 *    - Filter dropdown to show specific content categories
 *    - Clickable list to ADD resources to Active Resources slots
 *    - Shows highlighted state for already-selected resources
 * 
 * WORKFLOW:
 * Library Resources → Click to add → Active Resources slots → Radio button to view → Middle panel Resource Viewer
 */

import React from 'react';
import { FileText } from 'lucide-react';

const ResourcePanel = ({
  selectedResources,    // Array[5] - The 5 active resource slots (can have nulls)
  filteredResources,    // Array - Library resources filtered by category
  resourceFilter,       // String - Current category filter ('all', 'sermons', etc.)
  viewingResourceIndex, // Number|null - Which active resource slot is selected for viewing
  setResourceFilter,    // Function - Changes the library filter
  setViewingResourceIndex, // Function - Sets which active resource to view in middle panel
  onResourceSelect,     // Function - Adds a library resource to active resources
  onRemoveResource      // Function - Removes a resource from active resources slot
}) => {
  return (
    <div className="flex flex-col h-full">
      {/* 
        ACTIVE RESOURCES SECTION (TOP)
        - 5 fixed slots for currently selected resources
        - Radio buttons select which resource to display in middle panel Resource Viewer
        - Remove buttons (×) clear resources from slots
        - Empty slots show "Slot X - Empty" placeholder
      */}
      <div className="p-4 border-b border-brass/30 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-lg font-cormorant text-brass">Active Resources</h4>
          <div className="flex items-center gap-4 text-xs text-brass-light">
            <span>View</span>
            <span>Remove</span>
          </div>
        </div>
        
        {/* 5-Slot Resource Container */}
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map(index => {
            const resource = selectedResources[index]; // Can be null if slot is empty
            return (
              <div key={index} className="flex items-center gap-2">
                {/* Resource Display Card */}
                <div className={`flex-1 p-2 rounded text-sm ${
                  resource 
                    ? 'bg-brass/10 border border-brass/30'    // Filled slot styling
                    : 'bg-cream/30 border border-brass/20 opacity-50' // Empty slot styling
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
                
                {/* Control Buttons: View Radio + Remove Button */}
                <div className="flex items-center gap-2">
                  {/* Radio Button - Selects which resource to view in middle panel */}
                  <input
                    type="radio"
                    name="viewResource"
                    value={index}
                    checked={viewingResourceIndex === index}
                    onChange={() => setViewingResourceIndex(index)}
                    disabled={!resource} // Can't view empty slots
                    className="text-brass focus:ring-brass disabled:opacity-30"
                  />
                  {/* Remove Button - Clears this slot */}
                  <button
                    onClick={() => {
                      if (resource) {
                        onRemoveResource(index);
                      }
                    }}
                    disabled={!resource} // Can't remove from empty slots
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

      {/* 
        LIBRARY RESOURCES SECTION (BOTTOM)
        - Displays user's content library filtered by category
        - Click to ADD resources to Active Resources slots above
        - Filter dropdown to show specific content types
        - Shows highlighted state for resources already in Active Resources
      */}
      <div className="flex-1 bg-library-brown/10">
        <div className="px-2 pt-1 pb-0">
          <h4 className="text-base font-cormorant text-brass mb-1 flex items-center gap-2">
            <FileText size={16} />
            Library Resources
          </h4>
          
          {/* Category Filter Dropdown */}
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

          {/* Scrollable Resource List */}
          <div className="max-h-44 overflow-y-auto library-scrollbar space-y-1">
            {filteredResources.map(resource => (
              <div 
                key={resource.id}
                onClick={() => onResourceSelect(resource)} // Adds to Active Resources if slot available
                className={`p-2 rounded cursor-pointer text-xs transition-colors duration-200 ${
                  selectedResources.find(r => r.id === resource.id)
                    ? 'bg-brass/20 border border-brass/50'      // Already in Active Resources
                    : 'bg-cream/80 hover:bg-cream border border-brass/20'  // Available to add
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