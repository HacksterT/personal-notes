import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, Archive, Edit, Share2, Settings } from 'lucide-react';

const LibraryEntrance = () => {
  const navigate = useNavigate();
  const [selectedDoor, setSelectedDoor] = useState(null);

  const doors = [
    {
      icon: Book,
      title: "Study Hall",
      description: "Bible Research & Notes",
      path: "/study",
    },
  
    {
      icon: Archive,
      title: "Library Stacks", 
      description: "Content Storage & Retrieval",
      path: "/stacks",
    },
    {
      icon: Edit,
      title: "Sermon Workshop",
      description: "Sermon Creation & Editing", 
      path: "/workshop",
    },
    {
      icon: Share2,
      title: "Social Media Studio",
      description: "Publishing & Distribution", 
      path: "/social",
    }
  ];

  const handleDoorClick = (door, index) => {
    setSelectedDoor(index);
    // Simple navigation without complex animations
    navigate(door.path);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-library-gradient">
      
      {/* Header */}
      <div className="text-center mb-16">
        <h1 className="text-6xl font-light text-brass mb-4 font-cormorant">
          Sermon Organizer
        </h1>
        <p className="text-xl text-brass-light italic">
          Your Digital Theological Library
        </p>
        <div className="mt-4 w-32 h-0.5 bg-brass mx-auto"></div>
      </div>

      {/* Settings Button */}
      <div className="text-center mb-12">
        <button 
          onClick={() => navigate('/settings')}
          className="flex items-center gap-3 mx-auto bg-brass/10 text-brass-light hover:bg-brass/20 hover:text-cream transition-colors duration-300 py-2 px-6 rounded-lg border border-brass/30 shadow-sm"
        >
          <Settings size={20} />
          <span className="font-cormorant text-lg">Account Settings</span>
        </button>
      </div>

      {/* Library Doors */}
      <div className="grid grid-cols-2 gap-8 mb-12 max-w-4xl">
        {doors.map((door, index) => (
          <div
            key={door.path}
            className={`library-door relative group ${
              selectedDoor === index ? 'ring-2 ring-brass' : ''
            }`}
            onClick={() => handleDoorClick(door, index)}
          >
            {/* Door Content */}
            <div className="flex flex-col items-center justify-center h-full">
              {/* Icon */}
              <door.icon className="text-5xl text-brass mb-4 group-hover:text-brass-light" />
              
              {/* Title */}
              <h3 className="text-lg font-medium text-brass-light mb-2 text-center">
                {door.title}
              </h3>
              
              {/* Description */}
              <p className="text-sm text-brass italic text-center opacity-80">
                {door.description}
              </p>
            </div>

          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="text-center">
        <p className="text-cream opacity-70 text-lg mb-4">
          Choose your study space to begin
        </p>

        <div className="flex items-center justify-center gap-6 text-sm text-brass-light/60">
          <span>📚 Research</span>
          <span>🗃️ Storage</span>
          <span>✍️ Creation</span>
          <span>📱 Publishing</span>
        </div>
      </div>
    </div>
  );
};

export default LibraryEntrance;