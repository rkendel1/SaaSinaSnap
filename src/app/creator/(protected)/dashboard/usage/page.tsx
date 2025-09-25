import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { UsageDashboard } from '@/features/usage-tracking/components/UsageDashboard';

export default async function UsageTrackingPage() {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    redirect('/login');
  }

  const creatorProfile = await getCreatorProfile(user.id);

  if (!creatorProfile) {
    redirect('/creator/onboarding');
  }

  return (
    <div className="container mx-auto py-8">
      <UsageDashboard creatorId={user.id} />
    </div>
  );
}