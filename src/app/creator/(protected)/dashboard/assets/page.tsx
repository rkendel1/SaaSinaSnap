import { redirect } from 'next/navigation';
import { FileImage, FolderOpen } from 'lucide-react';

import { getSession } from '@/features/account/controllers/get-session';
import { AssetLibraryManager } from '@/features/creator/components/AssetLibraryManager';
import { getCreatorEmbedAssets } from '@/features/creator/controllers/embed-assets';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';

export default async function AssetLibraryPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const [creatorProfile, embedAssets] = await Promise.all([
    getCreatorProfile(session.user.id),
    getCreatorEmbedAssets(session.user.id),
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
            <h1 className="text-3xl font-bold text-gray-900">Asset Library</h1>
            <p className="text-gray-600">
              Manage, preview, and share your embed assets
            </p>
          </div>
        </div>
      </div>

      {embedAssets.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            <FileImage className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No assets yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first embed asset to get started. You can create product cards, 
              checkout buttons, pricing tables, and custom embeds.
            </p>
            <AssetLibraryManager 
              initialAssets={embedAssets} 
              creatorProfile={creatorProfile}
            />
          </div>
        </div>
      ) : (
        <AssetLibraryManager 
          initialAssets={embedAssets} 
          creatorProfile={creatorProfile}
        />
      )}
    </div>
  );
}