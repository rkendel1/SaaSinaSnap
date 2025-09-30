import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { getUser } from '@/features/account/controllers/get-user';
import { AdvancedPlatformAnalytics } from '@/features/platform-owner/components/AdvancedPlatformAnalytics';

export default async function AdvancedAnalyticsPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  const user = await getUser();
  if (!user) {
    redirect('/login');
  }
  
  // Type guard to ensure user has platform_owner role
  const userWithRole = user as any;
  if (!userWithRole.role || userWithRole.role !== 'platform_owner') {
    redirect('/dashboard');
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Advanced Platform Analytics</h1>
        <p className="text-gray-600">
          Deep insights into platform performance, user behavior, and business metrics.
        </p>
      </div>
      <AdvancedPlatformAnalytics />
    </div>
  );
}