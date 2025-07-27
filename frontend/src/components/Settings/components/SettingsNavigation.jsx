import React from 'react';

const SettingsNavigation = ({
  settingsTabs,
  activeTab,
  onTabChange,
  getTabClasses
}) => {
  return (
    <aside className="w-1/4">
      <nav className="flex flex-col gap-2">
        {settingsTabs.map(tab => {
          const IconComponent = tab.icon;
          
          return (
            <button 
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={getTabClasses(tab.id)}
              title={tab.description}
            >
              <IconComponent className="w-5 h-5" />
              <span>{tab.label}</span>
              {!tab.implemented && (
                <span className="ml-auto text-xs px-2 py-1 bg-brass/30 rounded-full">
                  Soon
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default SettingsNavigation;