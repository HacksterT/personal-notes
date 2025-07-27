import { useState } from 'react';
import { User, CreditCard, Bell, Shield, Tag } from 'lucide-react';

export const useSettingsNavigation = () => {
  const [activeTab, setActiveTab] = useState('profile');

  // Define all available settings tabs
  const settingsTabs = [
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      description: 'AI personalization and user profile settings',
      implemented: true
    },
    {
      id: 'tags',
      label: 'Tag Settings',
      icon: Tag,
      description: 'Manage content tags and social media platform tags',
      implemented: true
    },
    {
      id: 'account',
      label: 'Account & Billing',
      icon: CreditCard,
      description: 'Account information and billing settings',
      implemented: false
    },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      description: 'Email and app notification preferences',
      implemented: false
    },
    {
      id: 'security',
      label: 'Security',
      icon: Shield,
      description: 'Password, authentication, and security settings',
      implemented: false
    }
  ];

  // Handle tab navigation
  const handleTabChange = (tabId) => {
    const tab = settingsTabs.find(t => t.id === tabId);
    
    if (!tab) {
      console.warn(`Unknown settings tab: ${tabId}`);
      return;
    }

    if (!tab.implemented) {
      console.log(`Settings tab "${tab.label}" is not yet implemented`);
      // For now, just set the tab - in the future you might show a "coming soon" message
    }

    setActiveTab(tabId);
    console.log(`Settings: Switched to ${tab.label} tab`);
  };

  // Get current tab info
  const getCurrentTab = () => {
    return settingsTabs.find(tab => tab.id === activeTab) || settingsTabs[0];
  };

  // Get available tabs (filter out non-implemented if needed)
  const getAvailableTabs = (includeUnimplemented = true) => {
    return includeUnimplemented 
      ? settingsTabs 
      : settingsTabs.filter(tab => tab.implemented);
  };

  // Check if tab is active
  const isTabActive = (tabId) => {
    return activeTab === tabId;
  };

  // Get tab classes for styling
  const getTabClasses = (tabId) => {
    const baseClasses = "flex items-center gap-3 p-3 rounded-lg text-left text-lg transition-colors";
    const activeClasses = "bg-brass/20 text-brass";
    const inactiveClasses = "hover:bg-brass/10";
    
    return `${baseClasses} ${isTabActive(tabId) ? activeClasses : inactiveClasses}`;
  };

  return {
    // State
    activeTab,
    settingsTabs,
    
    // Handlers
    handleTabChange,
    setActiveTab,
    
    // Getters
    getCurrentTab,
    getAvailableTabs,
    isTabActive,
    getTabClasses
  };
};