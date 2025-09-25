import { redirect } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { getCreatorEmbedAssets } from '@/features/creator/controllers/embed-assets';
import { getCreatorProducts } from '@/features/creator-onboarding/controllers/creator-products';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { EmbedManagerClient } from '@/features/creator/components/EmbedManagerClient'; // Import the new client component

export default async function EmbedManagePage() {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    redirect('/login');
  }

  const [creatorProfile, embedAssets, products] = await Promise.all([
    getCreatorProfile(user.id),
    getCreatorEmbedAssets(user.id),
    getCreatorProducts(user.id),
  ]);

  if (!creatorProfile || !creatorProfile.onboarding_completed) {
    redirect('/creator/onboarding');
  }

  // Render the client component with the fetched data
  return (
    <EmbedManagerClient
      initialEmbeds={embedAssets}
      creatorProfile={creatorProfile}
      products={products}
    />
  );
}