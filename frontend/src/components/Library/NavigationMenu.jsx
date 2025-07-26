import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Book, Archive, Edit, Share2, BookOpen, ArrowLeft, Settings } from 'lucide-react';

const NavigationMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const doors = [
    {
      icon: Book,
      title: "Study Hall",
      path: "/study",
    },
    {
      icon: Edit,
      title: "Sermon Workshop",
      path: "/workshop",
    },
    {
      icon: Share2,
      title: "Social Media",
      path: "/social",
    },
    {
      icon: Archive,
      title: "Library Stacks", 
      path: "/stacks",
    },
    {
      icon: BookOpen,
      title: "Bible Room",
      path: "/bible",
    }
  ];

  const currentPath = location.pathname;

  return (
    <div className="flex items-center gap-4">
      {/* Return to Library Button */}
      <button 
        onClick={() => navigate('/entrance')}
        className="flex items-center gap-2 text-brass hover:text-brass-light transition-colors duration-300"
      >
        <ArrowLeft size={20} />
        <span className="font-cormorant">Return to Library</span>
      </button>
      
      <div className="h-6 w-px bg-brass/30" />
      
      {/* Quick Navigation Menu */}
      <div className="flex items-center gap-2">
        <span className="text-brass-light text-sm font-cormorant">Quick Nav:</span>
        {doors.map((door) => {
          const isActive = currentPath === door.path;
          const IconComponent = door.icon;
          
          return (
            <button
              key={door.path}
              onClick={() => navigate(door.path)}
              className={`p-2 rounded-lg transition-all duration-300 group relative ${
                isActive 
                  ? 'bg-brass/30 text-cream ring-1 ring-brass' 
                  : 'bg-brass/10 text-brass-light hover:bg-brass/20 hover:text-cream'
              }`}
              title={door.title}
            >
              <IconComponent size={18} />
              
              {/* Tooltip */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-library-dark text-cream text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                {door.title}
              </div>
            </button>
          );
        })}
      </div>
      {/* Settings Button */}
      <button
        onClick={() => navigate('/settings')}
        className={`p-2 rounded-lg transition-all duration-300 group relative ${
          currentPath === '/settings'
            ? 'bg-brass/30 text-cream ring-1 ring-brass' 
            : 'bg-brass/10 text-brass-light hover:bg-brass/20 hover:text-cream'
        }`}
        title="Settings"
      >
        <Settings size={18} />
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-library-dark text-cream text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
          Settings
        </div>
      </button>
    </div>
  );
};

export default NavigationMenu;