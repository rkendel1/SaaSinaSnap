import React from 'react';

import { CustomerTierPortal } from '@/features/usage-tracking/components/CustomerTierPortal';

export default function CustomerPortalDemo() {
  // This would typically come from the URL or context
  const demoCreatorId = 'demo-creator-id';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Customer Portal</h1>
          <p className="text-gray-600 mt-2">
            View your subscription details, usage, and billing information
          </p>
        </div>
        
        <CustomerTierPortal creatorId={demoCreatorId} />
      </div>
    </div>
  );
}