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
    platform_name: platformSettings.platform_name || undefined,
    platform_description: platformSettings.platform_description || undefined,
    platform_url: platformSettings.platform_url || undefined,
    support_email: platformSettings.support_email || undefined,
    notifications_enabled: platformSettings.notifications_enabled,
    maintenance_mode: platformSettings.maintenance_mode,
    stripe_test_account_id: undefined, // These would need to be fetched separately
    stripe_production_account_id: undefined,
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