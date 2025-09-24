import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';
import { getUser } from '@/features/account/controllers/get-user';
import { PlatformProductManager } from '@/features/platform-owner/components/PlatformProductManager';
import { getProducts } from '@/features/pricing/controllers/get-products';

export default async function PlatformProductsPage() {
  const [session, user] = await Promise.all([getSession(), getUser()]);

  if (!session?.user?.id || user?.role !== 'platform_owner') {
    redirect('/login');
  }

  const products = await getProducts();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <PlatformProductManager initialProducts={products} />
      </div>
    </div>
  );
}