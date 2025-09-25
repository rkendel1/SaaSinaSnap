import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';
import { getCreatorProductStatsAction } from '@/features/creator/actions/product-actions';
import { EnhancedProductManager } from '@/features/creator/components/EnhancedProductManager';
import { getCreatorProducts } from '@/features/creator-onboarding/controllers/creator-products';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';

export default async function CreatorProductsPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const [profile, products, stats] = await Promise.all([
    getCreatorProfile(session.user.id),
    getCreatorProducts(session.user.id),
    getCreatorProductStatsAction().catch(() => ({ total: 0, active: 0, archived: 0, deleted: 0 }))
  ]);

  if (!profile) {
    redirect('/creator/onboarding');
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Products</h1>
        <p className="text-gray-600 mt-1">Manage your products and offerings</p>
      </div>
      
      <EnhancedProductManager 
        initialProducts={products} 
        profile={profile} 
        stats={stats}
      />
    </div>
  );
}