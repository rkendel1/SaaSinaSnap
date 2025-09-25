import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';
import { getCreatorDashboardStats, getRecentCreatorAnalytics } from '@/features/creator/controllers/get-creator-analytics';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { CreatorAnalyticsDashboard } from '@/features/creator/components/CreatorAnalyticsDashboard';

export default async function AnalyticsPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const creatorProfile = await getCreatorProfile(session.user.id);

  if (!creatorProfile || !creatorProfile.onboarding_completed) {
    redirect('/creator/onboarding');
  }

  // Fetch initial data on the server
  const [dashboardStats, recentEvents] = await Promise.all([
    getCreatorDashboardStats(session.user.id),
    getRecentCreatorAnalytics(session.user.id, 10),
  ]);

  return (
    <CreatorAnalyticsDashboard 
      creatorProfile={creatorProfile} 
      initialStats={dashboardStats} 
      initialRecentEvents={recentEvents} // Pass initial events
    />
  );
}