import React from 'react';

// Import hooks
import { useSettingsNavigation } from './hooks/useSettingsNavigation';
import { useProfileData } from './hooks/useProfileData';
import { useContentTagManagement } from './hooks/useContentTagManagement';
import { useSocialMediaTagManagement } from './hooks/useSocialMediaTagManagement';

// Import components
import SettingsNavigation from './components/SettingsNavigation';
import ProfileSettingsPanel from './components/ProfileSettingsPanel';
import TagSettingsPanel from './components/TagSettingsPanel';
import AccountPanel from './components/AccountPanel';
import NotificationsPanel from './components/NotificationsPanel';
import SecurityPanel from './components/SecurityPanel';

// Import shared components
import NavigationMenu from '../Library/NavigationMenu';

const SettingsPage = () => {

  // Use custom hooks
  const navigationHook = useSettingsNavigation();
  const profileHook = useProfileData();
  const contentTagHook = useContentTagManagement();
  const socialMediaHook = useSocialMediaTagManagement();

  // Handle content tag operations with user feedback
  const handleContentTagAdd = (categoryKey) => {
    const result = contentTagHook.handleAddTag(categoryKey);
    if (result?.message) {
      if (result.success) {
        console.log(result.message);
        // You could add a toast notification here
      } else {
        alert(result.message);
      }
    }
  };

  const handleContentTagEdit = (categoryKey, oldName, newName) => {
    const result = contentTagHook.handleEditTag(categoryKey, oldName, newName);
    if (result?.message && result.success) {
      console.log(result.message);
      // You could add a toast notification here
    } else if (result?.message) {
      alert(result.message);
    }
  };

  const handleContentTagDelete = (categoryKey, tagName) => {
    const result = contentTagHook.handleDeleteTag(categoryKey, tagName);
    if (result?.message) {
      if (result.success) {
        console.log(result.message);
        // You could add a toast notification here
      }
    }
  };

  // Handle profile form submission with feedback
  const handleProfileSubmit = async (e) => {
    const result = await profileHook.handleSubmit(e);
    if (result?.message) {
      if (result.success) {
        console.log(result.message);
        // You could add a success toast here
      } else {
        console.error(result.message);
        // Error is already set in the hook
      }
    }
  };

  // Render content based on active tab
  const renderContent = () => {
    switch (navigationHook.activeTab) {
      case 'profile':
        return (
          <ProfileSettingsPanel
            profile={profileHook.profile}
            lookupData={profileHook.lookupData}
            loading={profileHook.loading}
            saving={profileHook.saving}
            error={profileHook.error}
            bibleVersions={profileHook.bibleVersions}
            onInputChange={profileHook.handleInputChange}
            onBibleVersionChange={profileHook.handleBibleVersionChange}
            onSubmit={handleProfileSubmit}
            isOtherTheologicalProfile={profileHook.isOtherTheologicalProfile}
            isOtherBibleVersionSelected={profileHook.isOtherBibleVersionSelected}
          />
        );
      
      case 'tags':
        return (
          <TagSettingsPanel
            contentTagData={contentTagHook}
            onContentTagAdd={handleContentTagAdd}
            onContentTagEdit={handleContentTagEdit}
            onContentTagDelete={handleContentTagDelete}
            onStartContentTagEdit={contentTagHook.startEditingTag}
            onCancelContentTagEdit={contentTagHook.cancelEditing}
            onStartAddingContentTag={contentTagHook.startAddingTag}
            onCancelAddingContentTag={contentTagHook.cancelAddingTag}
            onSetNewContentTagName={contentTagHook.setNewTagName}
            socialMediaData={socialMediaHook}
            onTogglePlatformStatus={socialMediaHook.togglePlatformStatus}
          />
        );
      
      case 'account':
        return <AccountPanel />;
      
      case 'notifications':
        return <NotificationsPanel />;
      
      case 'security':
        return <SecurityPanel />;
      
      default:
        return (
          <ProfileSettingsPanel
            profile={profileHook.profile}
            lookupData={profileHook.lookupData}
            loading={profileHook.loading}
            saving={profileHook.saving}
            error={profileHook.error}
            bibleVersions={profileHook.bibleVersions}
            onInputChange={profileHook.handleInputChange}
            onBibleVersionChange={profileHook.handleBibleVersionChange}
            onSubmit={handleProfileSubmit}
            isOtherTheologicalProfile={profileHook.isOtherTheologicalProfile}
            isOtherBibleVersionSelected={profileHook.isOtherBibleVersionSelected}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-library-gradient text-brass-light font-serif">
      {/* Header */}
      <div className="bg-library-dark/90 border-b-2 border-brass px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-4">
          <NavigationMenu />
          
          <div className="h-6 w-px bg-brass/30" />
          
          <h1 className="text-2xl font-cormorant text-brass">
            ⚙️ Settings
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Settings-specific actions could go here in the future */}
          <div className="text-sm text-brass-light">
            {navigationHook.getCurrentTab().description}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex max-w-7xl mx-auto p-8 gap-8">
        {/* Sidebar Navigation */}
        <SettingsNavigation
          settingsTabs={navigationHook.settingsTabs}
          activeTab={navigationHook.activeTab}
          onTabChange={navigationHook.handleTabChange}
          getTabClasses={navigationHook.getTabClasses}
        />

        {/* Content Area */}
        <main className="w-3/4 bg-library-dark/30 p-8 rounded-lg shadow-md">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;