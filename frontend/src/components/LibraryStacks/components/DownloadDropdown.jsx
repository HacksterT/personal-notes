import React, { useState, useRef, useEffect } from 'react';
import { Download, ChevronDown } from 'lucide-react';

const DownloadDropdown = ({ item, onDownload, className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // Available formats based on content type
  const getAvailableFormats = () => {
    const baseFormats = [
      { value: 'txt', label: 'Text (.txt)', icon: '📄' },
      { value: 'md', label: 'Markdown (.md)', icon: '📝' }
    ];
    
    // Add PDF option for sermons
    if (item.category === 'sermons') {
      baseFormats.push({ value: 'pdf', label: 'PDF (.pdf)', icon: '📕' });
    }
    
    return baseFormats;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFormatSelect = (format) => {
    setIsOpen(false);
    onDownload(item, format);
  };

  const formats = getAvailableFormats();

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className="p-2 text-wood-dark/60 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors flex items-center gap-1"
        title="Download options"
      >
        <Download size={16} />
        <ChevronDown size={12} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-1 bg-white border border-wood-light/30 rounded-lg shadow-lg z-50 min-w-[160px]">
          <div className="py-1">
            {formats.map((format) => (
              <button
                key={format.value}
                onClick={(e) => {
                  e.stopPropagation();
                  handleFormatSelect(format.value);
                }}
                className="w-full text-left px-3 py-2 hover:bg-wood-light/10 flex items-center gap-2 text-sm text-wood-dark transition-colors"
              >
                <span className="text-base">{format.icon}</span>
                <span>{format.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DownloadDropdown;