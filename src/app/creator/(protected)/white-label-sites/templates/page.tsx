import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { getCurrentTemplateThemeAction } from '@/features/creator/actions/template-actions';
import { TemplateSelector } from '@/features/creator/components/template-selector';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';

export default async function TemplatesPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  const creatorProfile = await getCreatorProfile(authenticatedUser.id);

  if (!creatorProfile || !creatorProfile.onboarding_completed) {
    redirect('/creator/onboarding');
  }

  // Get current template theme
  const currentTheme = await getCurrentTemplateThemeAction();

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Choose Template</h1>
        <p className="text-gray-600">
          Select a template that matches your brand and business style. All templates will automatically use your branding and extracted website data.
        </p>
      </div>

      <TemplateSelector
        creator={creatorProfile}
        currentTheme={currentTheme}
      />
    </div>
  );
}