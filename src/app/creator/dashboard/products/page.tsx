import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';
import { CreatorProductManager } from '@/features/creator/components/CreatorProductManager';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { getCreatorProducts } from '@/features/creator-onboarding/controllers/creator-products';

export default async function CreatorProductsPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const [profile, products] = await Promise.all([
    getCreatorProfile(session.user.id),
    getCreatorProducts(session.user.id),
  ]);

  if (!profile) {
    redirect('/creator/onboarding');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <CreatorProductManager initialProducts={products} profile={profile} />
      </div>
    </div>
  );
}