'use server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { getRecentCreatorAnalytics } from '@/features/creator/controllers/get-creator-analytics'; // Import the server-side controller

// This action allows a client component to trigger a server-side fetch for recent analytics events.
export async function getRecentCreatorAnalyticsAction(limit = 10) {
  const user = await getAuthenticatedUser();
  if (!user?.id) {
    throw new Error('Not authenticated');
  }
  return getRecentCreatorAnalytics(user.id, limit);
}