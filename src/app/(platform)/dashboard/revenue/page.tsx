import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { RevenueDashboard } from '@/features/platform-owner/components/RevenueDashboard';

export default async function PlatformRevenuePage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Revenue Dashboard</h1>
        <p className="text-gray-600">Track platform revenue, fees, and creator earnings across your SaaSinaSnap platform.</p>
      </div>
      <RevenueDashboard />
    </div>
  );
}