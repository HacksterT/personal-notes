import React from 'react';
import { AlertCircle, X, Wifi, Shield, FileX, Server, AlertTriangle } from 'lucide-react';

const ErrorToast = ({ errors, onDismiss }) => {
  if (!errors || errors.length === 0) return null;

  const getErrorIcon = (type) => {
    switch (type) {
      case 'network':
        return <Wifi size={16} className="text-orange-500" />;
      case 'permission':
        return <Shield size={16} className="text-red-500" />;
      case 'not_found':
        return <FileX size={16} className="text-yellow-500" />;
      case 'server':
        return <Server size={16} className="text-red-500" />;
      default:
        return <AlertTriangle size={16} className="text-red-500" />;
    }
  };

  const getErrorColor = (type) => {
    switch (type) {
      case 'network':
        return 'border-orange-200 bg-orange-50 text-orange-800';
      case 'permission':
        return 'border-red-200 bg-red-50 text-red-800';
      case 'not_found':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800';
      case 'server':
        return 'border-red-200 bg-red-50 text-red-800';
      default:
        return 'border-red-200 bg-red-50 text-red-800';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {errors.map((error) => (
        <div
          key={error.key}
          className={`
            flex items-start gap-3 p-4 rounded-lg border shadow-lg
            ${getErrorColor(error.type)}
            animate-in slide-in-from-right duration-300
          `}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getErrorIcon(error.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              Error
            </p>
            <p className="text-xs mt-1 break-words">
              {error.message}
            </p>
            {error.context && (
              <p className="text-xs mt-1 opacity-75">
                Context: {error.context}
              </p>
            )}
          </div>
          
          <button
            onClick={() => onDismiss(error.key)}
            className="flex-shrink-0 p-1 hover:bg-black/10 rounded"
            title="Dismiss error"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};

export default ErrorToast;