import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { EnhancedABTestingManager } from '@/features/creator/components/EnhancedABTestingManager';

export default async function ABTestingPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  const creatorProfile = await getCreatorProfile(authenticatedUser.id);

  if (!creatorProfile || !creatorProfile.onboarding_completed) {
    redirect('/creator/onboarding');
  }

  return (
    <div className="p-6">
      <EnhancedABTestingManager creatorId={authenticatedUser.id} />
    </div>
  );
}