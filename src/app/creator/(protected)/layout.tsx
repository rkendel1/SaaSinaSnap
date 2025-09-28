import { PropsWithChildren } from 'react';
import { redirect } from 'next/navigation';

import { SidebarNavigation } from '@/components/creator/sidebar-navigation';
import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
// Removed: import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';

export default async function CreatorLayout({ children }: PropsWithChildren) {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    redirect('/login');
  }

  // The check for onboarding completion and redirection to /creator/onboarding
  // will now be handled by the individual pages within the (protected) group,
  // or by the EnhancedOnboardingFlow component itself.
  // This prevents an infinite redirect loop if getCreatorProfile fails due to missing tenant context.

  return (
    <SidebarNavigation>
      {children}
    </SidebarNavigation>
  );
}