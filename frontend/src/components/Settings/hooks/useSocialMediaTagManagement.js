import { useState, useEffect } from 'react';
import { socialMediaPlatforms } from '../../../constants/tagConstants';

export const useSocialMediaTagManagement = () => {
  // Default social media platforms
  const defaultPlatforms = [
    { code: 'FB', name: 'Facebook', active: true },
    { code: 'IG', name: 'Instagram', active: true },
    { code: 'X', name: 'Twitter/X', active: true },
    { code: 'LI', name: 'LinkedIn', active: true },
    { code: 'TT', name: 'TikTok', active: true },
    { code: 'YT', name: 'YouTube', active: true }
  ];

  // State management
  const [platforms, setPlatforms] = useState(defaultPlatforms);
  const [platformUsage, setPlatformUsage] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingPlatform, setEditingPlatform] = useState(null);

  // Load platform data and usage statistics
  useEffect(() => {
    loadPlatformData();
  }, []);

  // Load platform usage statistics
  const loadPlatformData = async () => {
    setLoading(true);
    
    try {
      // TODO: Implement API calls to get platform usage statistics
      // For now, simulate with mock data
      console.log('Loading social media platform data...');
      
      // Simulate platform usage statistics
      const mockUsage = {
        'FB': 12,
        'IG': 18,
        'X': 8,
        'LI': 5,
        'TT': 15,
        'YT': 9
      };
      setPlatformUsage(mockUsage);
      
      console.log('✅ Social media platform data loaded successfully');
    } catch (error) {
      console.error('Error loading platform data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle platform active status
  const togglePlatformStatus = (platformCode) => {
    setPlatforms(prev => 
      prev.map(platform => 
        platform.code === platformCode 
          ? { ...platform, active: !platform.active }
          : platform
      )
    );
    
    const platform = platforms.find(p => p.code === platformCode);
    console.log(`${platform?.active ? 'Disabled' : 'Enabled'} platform: ${platform?.name}`);
  };

  // Get platform usage count
  const getPlatformUsageCount = (platformCode) => {
    return platformUsage[platformCode] || 0;
  };

  // Get active platforms only
  const getActivePlatforms = () => {
    return platforms.filter(platform => platform.active);
  };

  // Get inactive platforms
  const getInactivePlatforms = () => {
    return platforms.filter(platform => !platform.active);
  };

  // Get platform by code
  const getPlatformByCode = (code) => {
    return platforms.find(platform => platform.code === code);
  };

  // Get platform statistics
  const getPlatformStats = () => {
    const active = getActivePlatforms().length;
    const total = platforms.length;
    const totalUsage = Object.values(platformUsage).reduce((sum, count) => sum + count, 0);
    
    return {
      active,
      total,
      inactive: total - active,
      totalUsage
    };
  };

  // Get most used platforms
  const getMostUsedPlatforms = (limit = 3) => {
    return Object.entries(platformUsage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, limit)
      .map(([code, count]) => ({
        platform: getPlatformByCode(code),
        count
      }));
  };

  // Add custom platform (future feature)
  const addCustomPlatform = (code, name) => {
    const exists = platforms.some(p => p.code.toLowerCase() === code.toLowerCase());
    
    if (exists) {
      return { success: false, message: `Platform with code "${code}" already exists` };
    }

    const newPlatform = {
      code: code.toUpperCase(),
      name,
      active: true,
      custom: true
    };

    setPlatforms(prev => [...prev, newPlatform]);
    
    console.log(`Added custom platform: ${name} (${code})`);
    return { success: true, message: `Successfully added platform: ${name}` };
  };

  // Remove custom platform (future feature)
  const removeCustomPlatform = (platformCode) => {
    const platform = getPlatformByCode(platformCode);
    
    if (!platform?.custom) {
      return { success: false, message: 'Cannot remove default platforms' };
    }

    const usageCount = getPlatformUsageCount(platformCode);
    const confirmMessage = usageCount > 0 
      ? `Remove platform "${platform.name}"? This platform is used in ${usageCount} posts.`
      : `Remove platform "${platform.name}"?`;
      
    if (window.confirm(confirmMessage)) {
      setPlatforms(prev => prev.filter(p => p.code !== platformCode));
      
      // Remove from usage statistics
      const updatedUsage = { ...platformUsage };
      delete updatedUsage[platformCode];
      setPlatformUsage(updatedUsage);
      
      console.log(`Removed custom platform: ${platform.name}`);
      return { success: true, message: `Successfully removed platform: ${platform.name}` };
    }
    
    return { success: false, message: 'Removal cancelled' };
  };

  // Update platform usage (called when posts are created/deleted)
  const updatePlatformUsage = (platformCode, increment = true) => {
    setPlatformUsage(prev => ({
      ...prev,
      [platformCode]: Math.max(0, (prev[platformCode] || 0) + (increment ? 1 : -1))
    }));
  };

  // Get platform color for UI
  const getPlatformColor = (platformCode) => {
    const colors = {
      'FB': 'bg-blue-600',
      'IG': 'bg-pink-600',
      'X': 'bg-black',
      'LI': 'bg-blue-700',
      'TT': 'bg-black',
      'YT': 'bg-red-600'
    };
    return colors[platformCode] || 'bg-gray-600';
  };

  // Check if platform is available for posting
  const isPlatformAvailable = (platformCode) => {
    const platform = getPlatformByCode(platformCode);
    return platform?.active || false;
  };

  return {
    // State
    platforms,
    platformUsage,
    loading,
    editingPlatform,
    
    // Handlers
    togglePlatformStatus,
    addCustomPlatform,
    removeCustomPlatform,
    updatePlatformUsage,
    setEditingPlatform,
    
    // Getters
    getPlatformUsageCount,
    getActivePlatforms,
    getInactivePlatforms,
    getPlatformByCode,
    getPlatformStats,
    getMostUsedPlatforms,
    getPlatformColor,
    isPlatformAvailable,
    
    // Utilities
    loadPlatformData,
    
    // Setters for external control
    setPlatforms,
    setPlatformUsage
  };
};