import React from 'react';

import { TierManagementDashboard } from '@/features/usage-tracking/components/TierManagementDashboard';

export default function TiersPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Subscription Tiers</h1>
        <p className="text-gray-600 mt-2">
          Manage your subscription plans, pricing, and feature entitlements
        </p>
      </div>
      
      <TierManagementDashboard />
    </div>
  );
}