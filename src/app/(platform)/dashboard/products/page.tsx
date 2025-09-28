import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { getUser } from '@/features/account/controllers/get-user';
import { PlatformProductManager } from '@/features/platform-owner/components/PlatformProductManager';
import { getOrCreatePlatformSettings } from '@/features/platform-owner-onboarding/controllers/platform-settings';
import { getProducts } from '@/features/pricing/controllers/get-products';
import { Tables } from '@/libs/supabase/types';

export default async function PlatformProductsPage() {
  const authenticatedUser = await getAuthenticatedUser(); // Use getAuthenticatedUser

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  const user: Tables<'users'> | null = await getUser(); // Fetch full user profile
  if (!user) {
    redirect('/login');
  }
  
  // Type guard to ensure user has role property
  const userWithRole = user as any;
  if (!userWithRole.role || userWithRole.role !== 'platform_owner') {
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