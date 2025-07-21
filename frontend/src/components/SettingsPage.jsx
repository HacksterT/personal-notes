import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, CreditCard, Bell, Shield, Settings } from 'lucide-react';
import NavigationMenu from './Library/NavigationMenu';
import ProfileSettings from './ProfileSettings'; // We will create this next

const SettingsPage = () => {
  const navigate = useNavigate();
  // In a real app, this would come from a router or state management
  const activeTab = 'profile';

  const renderContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileSettings />;
      // Add cases for other tabs here later
      default:
        return <ProfileSettings />;
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
        </div>
      </div>

      {/* Main Content */}
      <div className="flex max-w-7xl mx-auto p-8 gap-8">
        {/* Sidebar Navigation */}
        <aside className="w-1/4">
          <nav className="flex flex-col gap-2">
            <button className={`flex items-center gap-3 p-3 rounded-lg text-left text-lg ${activeTab === 'profile' ? 'bg-brass/20 text-brass' : 'hover:bg-brass/10'}`}>
              <User className="w-5 h-5" /> Profile
            </button>
            <button className={`flex items-center gap-3 p-3 rounded-lg text-left text-lg ${activeTab === 'account' ? 'bg-brass/20 text-brass' : 'hover:bg-brass/10'}`}>
              <CreditCard className="w-5 h-5" /> Account & Billing
            </button>
            <button className={`flex items-center gap-3 p-3 rounded-lg text-left text-lg ${activeTab === 'notifications' ? 'bg-brass/20 text-brass' : 'hover:bg-brass/10'}`}>
              <Bell className="w-5 h-5" /> Notifications
            </button>
            <button className={`flex items-center gap-3 p-3 rounded-lg text-left text-lg ${activeTab === 'security' ? 'bg-brass/20 text-brass' : 'hover:bg-brass/10'}`}>
              <Shield className="w-5 h-5" /> Security
            </button>
          </nav>
        </aside>

        {/* Content Area */}
        <main className="w-3/4 bg-library-dark/30 p-8 rounded-lg shadow-md">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
