import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { BulkDataImportTool } from '@/features/creator/components/BulkDataImportTool';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';

export default async function DataImportPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  const creatorProfile = await getCreatorProfile(authenticatedUser.id);

  if (!creatorProfile || !creatorProfile.onboarding_completed) {
    redirect('/creator/onboarding');
  }

  return <BulkDataImportTool creatorProfile={creatorProfile as any} />;
}
