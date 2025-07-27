import React from 'react';
import { Shield, Lock, Key, UserCheck } from 'lucide-react';

const SecurityPanel = () => {
  return (
    <div>
      <h2 className="text-2xl font-cormorant text-brass mb-6">Security</h2>
      
      {/* Coming Soon Message */}
      <div className="bg-library-dark/30 rounded-lg p-8 text-center">
        <div className="mb-4">
          <Shield className="w-16 h-16 text-brass/60 mx-auto" />
        </div>
        <h3 className="text-xl font-semibold text-brass-light mb-2">Coming Soon</h3>
        <p className="text-brass-light/70 mb-6">
          Security settings and authentication options are being developed.
        </p>
        
        {/* Planned Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="flex items-center gap-3 p-3 bg-library-dark/20 rounded-lg">
            <Lock className="w-5 h-5 text-brass" />
            <span className="text-brass-light">Password Management</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-library-dark/20 rounded-lg">
            <Key className="w-5 h-5 text-brass" />
            <span className="text-brass-light">Two-Factor Authentication</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-library-dark/20 rounded-lg">
            <UserCheck className="w-5 h-5 text-brass" />
            <span className="text-brass-light">Login Sessions</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-library-dark/20 rounded-lg">
            <Shield className="w-5 h-5 text-brass" />
            <span className="text-brass-light">Privacy Controls</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityPanel;