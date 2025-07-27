import { useState, useEffect } from 'react';
import { apiService } from '../../../services/api';

export const useResourceLibrary = () => {
  const [availableResources, setAvailableResources] = useState([]);
  const [selectedResources, setSelectedResources] = useState([]);
  const [resourceFilter, setResourceFilter] = useState('all');
  const [viewingResourceIndex, setViewingResourceIndex] = useState(null);

  // Load resources when component mounts
  useEffect(() => {
    loadAvailableResources();
    loadActiveResourcesFromStorage();
  }, []);

  // Reload resources when filter changes to get fresh data
  useEffect(() => {
    if (resourceFilter !== 'all') {
      loadAvailableResources();
    }
  }, [resourceFilter]);

  // Load active resources from localStorage and fetch their themes
  const loadActiveResourcesFromStorage = async () => {
    try {
      const stored = localStorage.getItem('activeResources');
      if (stored) {
        const resources = JSON.parse(stored);
        
        // For each resource, fetch its complete data including themes
        const enrichedResources = await Promise.all(
          resources.map(async (resource) => {
            try {
              const fullData = await apiService.getContent(resource.id);
              return {
                ...resource,
                key_themes: fullData.key_themes || [],
                tags: fullData.tags || []
              };
            } catch (error) {
              console.error(`Failed to fetch themes for ${resource.title}:`, error);
              return resource; // Return original if fetch fails
            }
          })
        );
        
        setSelectedResources(enrichedResources);
        console.log(`📋 Loaded ${enrichedResources.length} active resources from storage with themes:`, 
          enrichedResources.map(r => ({ title: r.title, themes: r.key_themes?.length || 0 })));
      }
    } catch (error) {
      console.error('Failed to load active resources from storage:', error);
    }
  };

  const loadAvailableResources = async () => {
    try {
      console.log('📚 Loading available resources from library...');
      
      const categories = ['sermons', 'study-notes', 'research', 'journal', 'social-media-posts'];
      let allResources = [];
      
      // Load recent resources from each category
      for (const category of categories) {
        try {
          const response = await apiService.listContent(category, 10, 0); // Last 10 per category
          const items = response.items || [];
          
          // Format items for the resource selector
          const formattedItems = items.map(item => ({
            id: item.id,
            title: item.title,
            category: category,
            type: category,
            size: item.size_bytes ? formatFileSize(item.size_bytes) : '0 B',
            content: item.content, // Include content for viewing
            key_themes: item.key_themes || [], // Include key themes for sermon curation
            date_created: item.date_created,
            date_modified: item.date_modified
          }));
          
          allResources = [...allResources, ...formattedItems];
        } catch (err) {
          console.error(`Failed to load ${category} resources:`, err);
        }
      }
      
      // Sort by most recent first, handling potential null dates
      allResources.sort((a, b) => {
        const dateA = new Date(a.date_modified || a.date_created || 0);
        const dateB = new Date(b.date_modified || b.date_created || 0);
        return dateB - dateA;
      });
      
      setAvailableResources(allResources);
      console.log(`✅ Loaded ${allResources.length} resources from library`);
    } catch (err) {
      console.error('❌ Failed to load resources:', err);
      setAvailableResources([]);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleResourceSelect = async (resource) => {
    let newResources;
    if (selectedResources.find(r => r.id === resource.id)) {
      newResources = selectedResources.filter(r => r.id !== resource.id);
    } else if (selectedResources.length < 5) {
      // Fetch complete resource data including tags when adding
      try {
        const fullData = await apiService.getContent(resource.id);
        const enrichedResource = {
          ...resource,
          key_themes: fullData.key_themes || [],
          tags: fullData.tags || []
        };
        newResources = [...selectedResources, enrichedResource];
      } catch (error) {
        console.error(`Failed to fetch complete data for ${resource.title}:`, error);
        newResources = [...selectedResources, resource]; // Fallback to original
      }
    } else {
      return; // Don't add if already at max
    }
    
    setSelectedResources(newResources);
    // Sync with localStorage
    localStorage.setItem('activeResources', JSON.stringify(newResources));
    console.log('🔄 Updated active resources:', newResources.map(r => ({ title: r.title, key_themes: r.key_themes, tags: r.tags })));
  };

  const handleRemoveResource = (index) => {
    const newResources = [...selectedResources];
    newResources.splice(index, 1);
    setSelectedResources(newResources);
    localStorage.setItem('activeResources', JSON.stringify(newResources));
    if (viewingResourceIndex === index) {
      setViewingResourceIndex(null);
    }
  };

  const filteredResources = availableResources.filter(resource => {
    if (resourceFilter === 'all') return true;
    return resource.category === resourceFilter;
  });

  return {
    // State
    availableResources,
    selectedResources,
    resourceFilter,
    viewingResourceIndex,
    filteredResources,

    // Actions
    setResourceFilter,
    setViewingResourceIndex,
    handleResourceSelect,
    handleRemoveResource,
    loadAvailableResources
  };
};