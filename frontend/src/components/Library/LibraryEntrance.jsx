import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Book, Archive, Edit, Share2, BookOpen, Settings } from 'lucide-react';

const LibraryEntrance = () => {
  const navigate = useNavigate();
  const [selectedDoor, setSelectedDoor] = useState(null);

  const topRowDoors = [
    {
      icon: Book,
      title: "Study Hall",
      description: "Bible Research & Notes",
      path: "/study",
    },
    {
      icon: Edit,
      title: "Sermon Generator",
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

  const bottomRowDoors = [
    {
      icon: Archive,
      title: "Library Stacks", 
      description: "Content Storage & Retrieval",
      path: "/stacks",
    },
    {
      icon: BookOpen,
      title: "Bible Room",
      description: "Bible Reading & Study", 
      path: "/bible",
    }
  ];

  const handleDoorClick = (door, index, isBottomRow = false) => {
    const doorIndex = isBottomRow ? `bottom-${index}` : `top-${index}`;
    setSelectedDoor(doorIndex);
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
      <div className="mb-12 max-w-5xl">
        {/* Top Row - 3 columns */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {topRowDoors.map((door, index) => (
            <div
              key={door.path}
              className={`library-door-square relative group ${
                selectedDoor === `top-${index}` ? 'ring-2 ring-brass' : ''
              }`}
              onClick={() => handleDoorClick(door, index, false)}
            >
              {/* Door Content */}
              <div className="flex flex-col items-center justify-center h-full">
                {/* Icon */}
                {React.createElement(door.icon, { className: "text-4xl text-brass mb-3 group-hover:text-brass-light" })}
                
                {/* Title */}
                <h3 className="text-base font-medium text-brass-light mb-2 text-center">
                  {door.title}
                </h3>
                
                {/* Description */}
                <p className="text-xs text-brass italic text-center opacity-80">
                  {door.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Row - 2 columns positioned */}
        <div className="grid grid-cols-3 gap-6">
          {/* Library Stacks - positioned under left side */}
          <div
            key={bottomRowDoors[0].path}
            className={`library-door-square relative group ${
              selectedDoor === `bottom-0` ? 'ring-2 ring-brass' : ''
            }`}
            onClick={() => handleDoorClick(bottomRowDoors[0], 0, true)}
          >
            {/* Door Content */}
            <div className="flex flex-col items-center justify-center h-full">
              {/* Icon */}
              {React.createElement(bottomRowDoors[0].icon, { className: "text-4xl text-brass mb-3 group-hover:text-brass-light" })}
              
              {/* Title */}
              <h3 className="text-base font-medium text-brass-light mb-2 text-center">
                {bottomRowDoors[0].title}
              </h3>
              
              {/* Description */}
              <p className="text-xs text-brass italic text-center opacity-80">
                {bottomRowDoors[0].description}
              </p>
            </div>
          </div>
          
          {/* Bible Room - positioned under right side, spans 2 columns */}
          <div
            key={bottomRowDoors[1].path}
            className={`library-door-square relative group col-span-2 ${
              selectedDoor === `bottom-1` ? 'ring-2 ring-brass' : ''
            }`}
            onClick={() => handleDoorClick(bottomRowDoors[1], 1, true)}
          >
            {/* Door Content */}
            <div className="flex flex-col items-center justify-center h-full">
              {/* Icon */}
              {React.createElement(bottomRowDoors[1].icon, { className: "text-4xl text-brass mb-3 group-hover:text-brass-light" })}
              
              {/* Title */}
              <h3 className="text-base font-medium text-brass-light mb-2 text-center">
                {bottomRowDoors[1].title}
              </h3>
              
              {/* Description */}
              <p className="text-xs text-brass italic text-center opacity-80">
                {bottomRowDoors[1].description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="text-center">
        <p className="text-cream opacity-70 text-lg mb-4">
          Choose your study space to begin
        </p>

        <div className="flex items-center justify-center gap-4 text-sm text-brass-light/60">
          <span>📚 Research</span>
          <span>✍️ Creation</span>
          <span>📱 Publishing</span>
          <span>🗃️ Storage</span>
          <span>📖 Reading</span>
        </div>
      </div>
    </div>
  );
};

export default LibraryEntrance;