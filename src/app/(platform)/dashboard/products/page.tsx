import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { getUser } from '@/features/account/controllers/get-user';
import { PlatformProductManager } from '@/features/platform-owner/components/PlatformProductManager';
import { getOrCreatePlatformSettings } from '@/features/platform-owner-onboarding/controllers/platform-settings';
import { getProducts } from '@/features/pricing/controllers/get-products';

export default async function PlatformProductsPage() {
  const authenticatedUser = await getAuthenticatedUser(); // Use getAuthenticatedUser

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  const user = await getUser(); // Fetch full user profile
  if (user?.role !== 'platform_owner') {
    redirect('/login');
  }

  const [products, settings] = await Promise.all([
    getProducts({ includeInactive: true }),
    getOrCreatePlatformSettings(authenticatedUser.id), // Use authenticatedUser.id
  ]);

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <PlatformProductManager initialProducts={products} settings={settings} />
    </div>
  );
}