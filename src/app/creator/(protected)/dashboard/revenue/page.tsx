import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { CreatorRevenueDashboard } from '@/features/creator/components/CreatorRevenueDashboard';
import { getCreatorDashboardStats } from '@/features/creator/controllers/get-creator-analytics';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';

export default async function CreatorRevenuePage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  const [creatorProfile, dashboardStats] = await Promise.all([
    getCreatorProfile(authenticatedUser.id),
    getCreatorDashboardStats(authenticatedUser.id),
  ]);

  if (!creatorProfile || !creatorProfile.onboarding_completed) {
    redirect('/creator/onboarding');
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Revenue Dashboard</h1>
        <p className="text-gray-600 mt-1">Track your earnings, platform fees, and revenue performance</p>
      </div>
      <CreatorRevenueDashboard 
        creatorProfile={creatorProfile}
        initialStats={dashboardStats}
      />
    </div>
  );
}