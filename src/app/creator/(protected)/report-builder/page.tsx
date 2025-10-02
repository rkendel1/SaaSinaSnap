import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { ReportBuilderTool } from '@/features/creator/components/ReportBuilderTool';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';

export default async function ReportBuilderPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  const creatorProfile = await getCreatorProfile(authenticatedUser.id);

  if (!creatorProfile || !creatorProfile.onboarding_completed) {
    redirect('/creator/onboarding');
  }

  return <ReportBuilderTool creatorProfile={creatorProfile as any} />;
}
