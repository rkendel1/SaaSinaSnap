import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { getOrCreatePlatformSettings } from '@/features/platform-owner-onboarding/controllers/platform-settings';
import { getProducts } from '@/features/pricing/controllers/get-products';

import { PlatformDesignStudioClient } from './PlatformDesignStudioClient';

export default async function PlatformDesignStudioPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  const [settings, products] = await Promise.all([
    getOrCreatePlatformSettings(authenticatedUser.id),
    getProducts({ includeInactive: true }),
  ]);

  return (
    <PlatformDesignStudioClient 
      userId={authenticatedUser.id}
      settings={settings}
      products={products}
    />
  );
}
