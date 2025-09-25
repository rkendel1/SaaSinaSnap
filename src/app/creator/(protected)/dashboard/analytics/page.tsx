import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { PostHogSaaSDashboard } from '@/features/creator/components/PostHogSaaSDashboard';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';

export default async function AnalyticsPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  const creatorProfile = await getCreatorProfile(authenticatedUser.id);

  if (!creatorProfile || !creatorProfile.onboarding_completed) {
    redirect('/creator/onboarding');
  }

  return (
    <PostHogSaaSDashboard 
      creatorProfile={creatorProfile} 
    />
  );
}