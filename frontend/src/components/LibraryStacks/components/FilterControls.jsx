import React from 'react';
import { Grid3x3, List, Filter, Clock, Star } from 'lucide-react';

const FilterControls = ({
  viewMode,
  onViewModeChange,
  filterMode,
  onFilterModeChange,
  sortMode,
  onSortModeChange,
  multiTagFilters,
  onMultiTagChange,
  onMultiTagOperatorChange,
  availableTags,
  onClearFilters
}) => {
  return (
    <div className="bg-white rounded-lg border border-wood-light/30 p-4 space-y-4">
      {/* View Mode Toggle */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-wood-dark">View:</span>
        <div className="flex rounded-lg border border-wood-light/30 overflow-hidden">
          <button
            onClick={() => onViewModeChange('cards')}
            className={`px-3 py-1 text-sm flex items-center gap-1 transition-colors ${
              viewMode === 'cards'
                ? 'bg-brass text-white'
                : 'bg-white text-wood-dark hover:bg-wood-light/10'
            }`}
          >
            <Grid3x3 size={14} />
            Cards
          </button>
          <button
            onClick={() => onViewModeChange('list')}
            className={`px-3 py-1 text-sm flex items-center gap-1 transition-colors ${
              viewMode === 'list'
                ? 'bg-brass text-white'
                : 'bg-white text-wood-dark hover:bg-wood-light/10'
            }`}
          >
            <List size={14} />
            List
          </button>
        </div>
      </div>

      {/* Filter Mode */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-wood-dark">Filter:</span>
        <select
          value={filterMode}
          onChange={(e) => onFilterModeChange(e.target.value)}
          className="px-3 py-1 text-sm border border-wood-light/30 rounded-lg bg-white text-wood-dark"
        >
          <option value="all">All Content</option>
          <option value="recent">Recent (7 days)</option>
          <option value="favorites">Favorites</option>
          <option value="shared">Shared</option>
        </select>
      </div>

      {/* Sort Mode */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-wood-dark">Sort:</span>
        <select
          value={sortMode}
          onChange={(e) => onSortModeChange(e.target.value)}
          className="px-3 py-1 text-sm border border-wood-light/30 rounded-lg bg-white text-wood-dark"
        >
          <option value="date">Date Modified</option>
          <option value="title">Title</option>
          <option value="category">Category</option>
        </select>
      </div>

      {/* Multi-Tag Filters */}
      <div className="space-y-2">
        <span className="text-sm font-medium text-wood-dark">Tag Filters:</span>
        {multiTagFilters.map((filter, index) => (
          <div key={index} className="flex items-center gap-2">
            <select
              value={filter.operator}
              onChange={(e) => onMultiTagOperatorChange(index, e.target.value)}
              className="px-2 py-1 text-xs border border-wood-light/30 rounded bg-white text-wood-dark"
            >
              <option value="AND">AND</option>
              <option value="OR">OR</option>
            </select>
            <select
              value={filter.tag}
              onChange={(e) => onMultiTagChange(index, e.target.value)}
              className="flex-1 px-2 py-1 text-xs border border-wood-light/30 rounded bg-white text-wood-dark"
            >
              <option value="">Select tag...</option>
              {availableTags.map((tag) => (
                <option key={tag} value={tag}>
                  {tag}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>

      {/* Clear Filters */}
      <button
        onClick={onClearFilters}
        className="w-full px-3 py-2 text-sm text-wood-dark hover:text-brass bg-wood-light/10 hover:bg-brass/10 border border-wood-light/30 rounded-lg transition-colors"
      >
        Clear All Filters
      </button>
    </div>
  );
};

export default FilterControls;