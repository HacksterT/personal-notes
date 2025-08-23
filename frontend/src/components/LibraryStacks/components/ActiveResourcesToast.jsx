import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, X } from 'lucide-react';

const ActiveResourcesToast = ({ message, type, isVisible, onClose, autoHideDuration = 3000 }) => {
  useEffect(() => {
    if (isVisible && autoHideDuration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, autoHideDuration);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, autoHideDuration, onClose]);

  if (!isVisible) return null;

  const getToastStyles = () => {
    const baseStyles = "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 max-w-sm";
    
    if (type === 'success') {
      return `${baseStyles} bg-green-600 text-white`;
    } else if (type === 'warning') {
      return `${baseStyles} bg-amber-600 text-white`;
    } else if (type === 'error') {
      return `${baseStyles} bg-red-600 text-white`;
    }
    
    return `${baseStyles} bg-gray-600 text-white`;
  };

  const getIcon = () => {
    if (type === 'success') {
      return <CheckCircle size={20} />;
    } else if (type === 'warning' || type === 'error') {
      return <AlertCircle size={20} />;
    }
    return null;
  };

  return (
    <div className={getToastStyles()}>
      {getIcon()}
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="text-white/80 hover:text-white transition-colors"
      >
        <X size={16} />
      </button>
    </div>
  );
};

export default ActiveResourcesToast;