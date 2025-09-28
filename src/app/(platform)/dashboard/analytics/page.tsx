import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { getUser } from '@/features/account/controllers/get-user';
import { AnalyticsDashboard } from '@/features/platform-owner/components/AnalyticsDashboard';
import { Tables } from '@/libs/supabase/types';

export default async function PlatformAnalyticsPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  const user = await getUser();
  if (!user || !(user && typeof user === 'object' && 'role' in user) || user.role !== 'platform_owner') {
    redirect('/login');
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600">Monitor platform performance, user engagement, and creator activity across your SaaSinaSnap platform.</p>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}