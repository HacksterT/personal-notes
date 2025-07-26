import React, { useState } from 'react';
import { Copy, Share2, X, Check } from 'lucide-react';

const VerseTool = ({ selectedVerses, getSelectedText, onClearSelection, isDarkMode = false }) => {
  const [copied, setCopied] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);

  if (selectedVerses.size === 0) {
    return null;
  }

  const handleCopy = async () => {
    const text = getSelectedText();
    if (text) {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy text:', err);
      }
    }
  };

  const handleShare = () => {
    setShowShareMenu(!showShareMenu);
  };

  const handleEmailShare = () => {
    const text = getSelectedText();
    const subject = 'Bible Verse';
    const body = encodeURIComponent(text);
    window.open(`mailto:?subject=${subject}&body=${body}`);
    setShowShareMenu(false);
  };

  const handleSocialShare = () => {
    const text = getSelectedText();
    const tweetText = encodeURIComponent(text);
    window.open(`https://twitter.com/intent/tweet?text=${tweetText}`);
    setShowShareMenu(false);
  };

  return (
    <div className="relative">
      {/* Tool Bar */}
      <div className={`flex items-center gap-2 rounded-lg px-3 py-2 ${
        isDarkMode ? 'bible-tool-bar-dark' : 'bible-tool-bar'
      }`}>
        <span className="text-xs text-brass-light">
          {selectedVerses.size} verse{selectedVerses.size > 1 ? 's' : ''}
        </span>
        
        <div className="w-px h-4 bg-brass/30" />
        
        {/* Copy Button */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-1 text-brass-light hover:text-cream transition-colors"
          title="Copy verses"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          <span className="text-xs">{copied ? 'Copied!' : 'Copy'}</span>
        </button>
        
        {/* Share Button */}
        <button
          onClick={handleShare}
          className="flex items-center gap-1 px-2 py-1 text-brass-light hover:text-cream transition-colors"
          title="Share verses"
        >
          <Share2 size={16} />
          <span className="text-xs">Share</span>
        </button>
        
        {/* Clear Selection */}
        <button
          onClick={onClearSelection}
          className="p-1 text-brass-light hover:text-cream transition-colors"
          title="Clear selection"
        >
          <X size={16} />
        </button>
      </div>

      {/* Share Menu */}
      {showShareMenu && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-10"
            onClick={() => setShowShareMenu(false)}
          />
          
          {/* Menu */}
          <div className={`absolute top-full right-0 mt-2 w-48 rounded-lg shadow-lg z-20 ${
            isDarkMode ? 'bible-version-dropdown-dark' : 'bible-version-dropdown'
          }`}>
            <div className="py-2">
              <button
                onClick={handleEmailShare}
                className={`w-full text-left px-4 py-2 text-cream ${
                  isDarkMode ? 'bible-version-option-dark' : 'bible-version-option'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span>📧</span>
                  <span>Email</span>
                </div>
              </button>
              
              <button
                onClick={handleSocialShare}
                className={`w-full text-left px-4 py-2 text-cream ${
                  isDarkMode ? 'bible-version-option-dark' : 'bible-version-option'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span>🐦</span>
                  <span>Twitter</span>
                </div>
              </button>
              
              <div className="border-t border-brass/20 mt-2 pt-2">
                <div className="px-4 py-2 text-xs text-brass-light">
                  More sharing options coming soon
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default VerseTool;