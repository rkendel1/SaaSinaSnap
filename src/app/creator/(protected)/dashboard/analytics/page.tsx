import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { getCreatorDashboardStats, getRecentCreatorAnalytics } from '@/features/creator/controllers/get-creator-analytics';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { CreatorAnalyticsDashboard } from '@/features/creator/components/CreatorAnalyticsDashboard';

export default async function AnalyticsPage() {
  const authenticatedUser = await getAuthenticatedUser(); // Use getAuthenticatedUser

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  const creatorProfile = await getCreatorProfile(authenticatedUser.id); // Use authenticatedUser.id

  if (!creatorProfile || !creatorProfile.onboarding_completed) {
    redirect('/creator/onboarding');
  }

  // Fetch initial data on the server
  const [dashboardStats, recentEvents] = await Promise.all([
    getCreatorDashboardStats(authenticatedUser.id), // Use authenticatedUser.id
    getRecentCreatorAnalytics(authenticatedUser.id, 10), // Use authenticatedUser.id
  ]);

  return (
    <CreatorAnalyticsDashboard 
      creatorProfile={creatorProfile} 
      initialStats={dashboardStats} 
      initialRecentEvents={recentEvents} // Pass initial events
    />
  );
}