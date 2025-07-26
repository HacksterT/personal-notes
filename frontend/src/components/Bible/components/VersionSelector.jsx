import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const VersionSelector = ({ currentVersion, onVersionChange, isDarkMode = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const versions = [
    { code: 'NLT', name: 'New Living Translation', description: 'Contemporary English' },
    { code: 'KJV', name: 'King James Version', description: 'Classic English' },
    { code: 'NLTUK', name: 'NLT (UK English)', description: 'British English' },
    { code: 'NTV', name: 'Nueva Traducción Viviente', description: 'Spanish' }
  ];

  const handleVersionSelect = (version) => {
    onVersionChange(version.code);
    setIsOpen(false);
  };

  const currentVersionData = versions.find(v => v.code === currentVersion);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded text-cream ${
          isDarkMode ? 'bible-version-selector-btn-dark' : 'bible-version-selector-btn'
        }`}
      >
        <span className="font-medium">{currentVersionData?.code || currentVersion}</span>
        <ChevronDown size={16} className={`transform transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className={`absolute top-full left-0 mt-1 w-72 rounded shadow-lg z-20 ${
            isDarkMode ? 'bible-version-dropdown-dark' : 'bible-version-dropdown'
          }`}>
            <div className="py-2">
              {versions.map((version) => (
                <button
                  key={version.code}
                  onClick={() => handleVersionSelect(version)}
                  className={`w-full text-left px-4 py-3 ${
                    isDarkMode ? 'bible-version-option-dark' : 'bible-version-option'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-cream">{version.code}</span>
                        {currentVersion === version.code && (
                          <Check size={16} className="text-brass" />
                        )}
                      </div>
                      <div className="text-sm text-brass-light">{version.name}</div>
                      <div className="text-xs text-brass-light/70">{version.description}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VersionSelector;