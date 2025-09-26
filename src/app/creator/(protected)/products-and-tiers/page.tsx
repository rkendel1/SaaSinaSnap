import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { ProductAndTierManager } from '@/features/creator/components/ProductAndTierManager';
import { getCreatorProducts } from '@/features/creator-onboarding/controllers/creator-products';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { TierManagementService } from '@/features/usage-tracking/services/tier-management-service';

export default async function ProductsAndTiersPage() {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    redirect('/login');
  }

  const [creatorProfile, products, tiers] = await Promise.all([
    getCreatorProfile(user.id),
    getCreatorProducts(user.id),
    TierManagementService.getCreatorTiers(user.id),
  ]);

  if (!creatorProfile || !creatorProfile.onboarding_completed) {
    redirect('/creator/onboarding');
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Products & Tiers</h1>
        <p className="text-gray-600 mt-1">Manage your products, pricing, and subscription tiers in one place.</p>
      </div>
      
      <ProductAndTierManager
        initialProducts={products}
        initialTiers={tiers}
        creatorProfile={creatorProfile}
      />
    </div>
  );
}