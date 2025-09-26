import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { StorefrontCreationStep } from '@/features/creator-onboarding/components/steps/StorefrontCreationStep';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';

export default async function StorefrontCustomizePage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Customize Your Storefront</h1>
        <p className="text-gray-600">
          Personalize your storefront design and content to match your brand. These changes will be reflected immediately on your live storefront.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <StorefrontCreationStep 
          profile={creatorProfile}
          businessType={null}
          selectedFeatures={[]}
          setSubmitFunction={() => {}} // No-op for standalone use
        />
      </div>
    </div>
  );
}