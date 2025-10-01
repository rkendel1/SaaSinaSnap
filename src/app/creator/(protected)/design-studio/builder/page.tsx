import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { EmbedBuilderClient } from '@/features/creator/components/EmbedBuilderClient'; // Import the new client component
import { getCreatorProducts } from '@/features/creator-onboarding/controllers/creator-products';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { serializeForClient } from '@/utils/serialize-for-client';

export default async function EmbedBuilderPage() {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    redirect('/login');
  }

  const [creatorProfile, products] = await Promise.all([
    getCreatorProfile(user.id),
    getCreatorProducts(user.id, { includeInactive: true }), // Fetch all products for management
  ]);

  if (!creatorProfile || !creatorProfile.onboarding_completed) {
    redirect('/creator/onboarding');
  }

  return (
    <EmbedBuilderClient
      creatorProfile={serializeForClient(creatorProfile)}
      products={serializeForClient(products)}
    />
  );
}