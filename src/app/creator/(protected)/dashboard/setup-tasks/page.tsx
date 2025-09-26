import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { PostOnboardingTaskDashboard } from '@/features/creator-onboarding/components/PostOnboardingTaskDashboard';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';

export default async function SetupTasksPage() {
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Setup Tasks</h1>
        <p className="text-gray-600">
          Complete these tasks to unlock the full potential of your platform. Take your time and customize everything to your needs.
        </p>
      </div>

      <PostOnboardingTaskDashboard profile={creatorProfile} />
    </div>
  );
}