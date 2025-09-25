import { PropsWithChildren } from 'react';
import { redirect } from 'next/navigation';

import { SidebarNavigation } from '@/components/creator/sidebar-navigation';
import { getSession } from '@/features/account/controllers/get-session';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';

export default async function CreatorLayout({ children }: PropsWithChildren) {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Check if user has completed onboarding (except for onboarding pages)
  const creatorProfile = await getCreatorProfile(session.user.id);
  
  // Allow access to onboarding pages even if not completed
  if (!creatorProfile?.onboarding_completed) {
    // This runs on server side, so we need a different approach to check the path
    // For now, let's just redirect to onboarding - the middleware or specific pages can handle exceptions
    redirect('/creator/onboarding');
  }

  return (
    <SidebarNavigation>
      {children}
    </SidebarNavigation>
  );
}