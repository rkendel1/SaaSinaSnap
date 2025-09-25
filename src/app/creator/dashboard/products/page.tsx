import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';
import { EnhancedProductManager } from '@/features/creator/components/EnhancedProductManager';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { getCreatorProducts } from '@/features/creator-onboarding/controllers/creator-products';
import { getCreatorProductStatsAction } from '@/features/creator/actions/product-actions';

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
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-7xl mx-auto py-8 px-4">
        <EnhancedProductManager 
          initialProducts={products} 
          profile={profile} 
          stats={stats}
        />
      </div>
    </div>
  );
}