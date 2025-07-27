import React from 'react';

const PlatformSelector = ({
  selectedPlatform,
  selectedFormat,
  platforms,
  formats,
  onPlatformSelect,
  onFormatSelect,
  disabled = true // Currently disabled as this is future functionality
}) => {
  return (
    <div style={{
      marginTop: '20px',
      padding: '15px',
      backgroundColor: 'rgba(212, 175, 55, 0.1)',
      borderRadius: '8px',
      border: '1px solid rgba(212, 175, 55, 0.3)',
      fontSize: '14px',
      display: 'flex',
      alignItems: 'center',
      gap: '40px'
    }}>
      {/* Platform Selection */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <strong style={{ color: '#d4af37' }}>Platform:</strong>
        <div style={{ display: 'flex', gap: '6px' }}>
          {platforms.map(platform => (
            <button
              key={platform}
              onClick={() => !disabled && onPlatformSelect(platform)}
              style={{
                padding: '4px 12px',
                borderRadius: '12px',
                border: `1px solid ${selectedPlatform === platform ? '#d4af37' : '#d4af37'}`,
                backgroundColor: selectedPlatform === platform && !disabled ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                color: '#d4af37',
                fontSize: '12px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : (selectedPlatform === platform ? 1 : 0.8),
                textTransform: 'capitalize',
                transition: 'all 0.2s'
              }}
              disabled={disabled}
            >
              {platform}
            </button>
          ))}
        </div>
      </div>

      {/* Content Format */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <strong style={{ color: '#d4af37' }}>Format:</strong>
        <div style={{ display: 'flex', gap: '6px' }}>
          {formats.map(format => (
            <button
              key={format}
              onClick={() => !disabled && onFormatSelect(format)}
              style={{
                padding: '4px 12px',
                borderRadius: '12px',
                border: `1px solid ${selectedFormat === format ? '#d4af37' : '#d4af37'}`,
                backgroundColor: selectedFormat === format && !disabled ? 'rgba(212, 175, 55, 0.2)' : 'transparent',
                color: '#d4af37',
                fontSize: '12px',
                cursor: disabled ? 'not-allowed' : 'pointer',
                opacity: disabled ? 0.6 : (selectedFormat === format ? 1 : 0.8),
                textTransform: 'capitalize',
                transition: 'all 0.2s'
              }}
              disabled={disabled}
            >
              {format}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlatformSelector;