import { redirect } from 'next/navigation';
import { Code, FolderOpen } from 'lucide-react';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { EnhancedAssetLibraryManager } from '@/features/creator/components/EnhancedAssetLibraryManager';
import { getCreatorEmbedAssets } from '@/features/creator/controllers/embed-assets';
import { getCreatorProducts } from '@/features/creator-onboarding/controllers/creator-products';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { serializeForClient } from '@/utils/serialize-for-client';

export default async function EmbedsAndScriptsPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  const [creatorProfile, embedAssets, products] = await Promise.all([
    getCreatorProfile(authenticatedUser.id),
    getCreatorEmbedAssets(authenticatedUser.id),
    getCreatorProducts(authenticatedUser.id),
  ]);

  if (!creatorProfile || !creatorProfile.onboarding_completed) {
    redirect('/creator/onboarding');
  }

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <FolderOpen className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Design Studio & Asset Library</h1>
            <p className="text-gray-600">
              Manage embeds, scripts, and all your design assets. Preview with design tokens and copy embed codes.
            </p>
          </div>
        </div>
      </div>

      <EnhancedAssetLibraryManager
        initialAssets={serializeForClient(embedAssets)}
        creatorProfile={serializeForClient(creatorProfile)}
        products={serializeForClient(products) as any}
      />
    </div>
  );
}