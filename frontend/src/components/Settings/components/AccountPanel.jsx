import React from 'react';
import { CreditCard, User, Calendar, DollarSign } from 'lucide-react';

const AccountPanel = () => {
  return (
    <div>
      <h2 className="text-2xl font-cormorant text-brass mb-6">Account & Billing</h2>
      
      {/* Coming Soon Message */}
      <div className="bg-library-dark/30 rounded-lg p-8 text-center">
        <div className="mb-4">
          <CreditCard className="w-16 h-16 text-brass/60 mx-auto" />
        </div>
        <h3 className="text-xl font-semibold text-brass-light mb-2">Coming Soon</h3>
        <p className="text-brass-light/70 mb-6">
          Account management and billing features are currently in development.
        </p>
        
        {/* Planned Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="flex items-center gap-3 p-3 bg-library-dark/20 rounded-lg">
            <User className="w-5 h-5 text-brass" />
            <span className="text-brass-light">Account Information</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-library-dark/20 rounded-lg">
            <Calendar className="w-5 h-5 text-brass" />
            <span className="text-brass-light">Subscription Management</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-library-dark/20 rounded-lg">
            <DollarSign className="w-5 h-5 text-brass" />
            <span className="text-brass-light">Billing History</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-library-dark/20 rounded-lg">
            <CreditCard className="w-5 h-5 text-brass" />
            <span className="text-brass-light">Payment Methods</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPanel;