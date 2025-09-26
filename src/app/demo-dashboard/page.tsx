import React from 'react';

import { TierManagementDashboard } from '@/features/usage-tracking/components/TierManagementDashboard';

export default function DemoDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Enhanced Tier Management Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Demonstrating the new enhanced tier management features including templates, cloning, 
            bulk operations, real-time previews, and guided setup wizard.
          </p>
        </div>
        
        <TierManagementDashboard />
      </div>
    </div>
  );
}