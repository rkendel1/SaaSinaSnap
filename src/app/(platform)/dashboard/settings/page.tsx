import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { getUser } from '@/features/account/controllers/get-user';
import { PlatformSettings } from '@/features/platform-owner/components/PlatformSettings';
import { getOrCreatePlatformSettings } from '@/features/platform-owner-onboarding/controllers/platform-settings';

export default async function PlatformSettingsPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  const user = await getUser();
  if (user?.role !== 'platform_owner') {
    redirect('/login');
  }

  const platformSettings = await getOrCreatePlatformSettings(authenticatedUser.id);

  // Transform the database object to match the component interface  
  const transformedSettings = {
    platform_name: undefined, // Not available in current schema
    platform_description: undefined, // Not available in current schema  
    platform_url: undefined, // Not available in current schema
    support_email: undefined, // Not available in current schema
    notifications_enabled: undefined, // Not available in current schema
    maintenance_mode: undefined, // Not available in current schema
    stripe_test_account_id: platformSettings.stripe_account_id || undefined,
    stripe_production_account_id: platformSettings.stripe_account_id || undefined,
    webhook_endpoints: [], // These would need to be fetched separately
    api_keys: [], // These would need to be fetched separately
  };

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Platform Settings</h1>
        <p className="text-gray-600">Configure your platform settings, integrations, and security options.</p>
      </div>
      <PlatformSettings initialSettings={transformedSettings} />
    </div>
  );
}