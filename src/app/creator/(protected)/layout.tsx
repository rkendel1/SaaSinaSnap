import { PropsWithChildren } from 'react';
import { redirect } from 'next/navigation';

import { SidebarNavigation } from '@/components/creator/sidebar-navigation';
import { EnhancedAuthService } from '@/features/account/controllers/enhanced-auth-service';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';

export default async function CreatorLayout({ children }: PropsWithChildren) {
  // Use EnhancedAuthService for robust role detection
  const userRole = await EnhancedAuthService.getCurrentUserRole();

  // If user is not authenticated, redirect to login
  if (userRole.type === 'unauthenticated') {
    redirect('/login');
  }
  
  // If user is not a creator, redirect them to their appropriate dashboard
  if (userRole.type !== 'creator') {
    const { redirectPath } = await EnhancedAuthService.getUserRoleAndRedirect();
    if (redirectPath) {
      redirect(redirectPath);
    } else {
      redirect('/pricing');
    }
  }

  // Check if user has completed onboarding
  if (userRole.id) {
    const creatorProfile = await getCreatorProfile(userRole.id);
    
    if (!creatorProfile?.onboarding_completed) {
      redirect('/creator/onboarding');
    }
  }

  return (
    <SidebarNavigation>
      {children}
    </SidebarNavigation>
  );
}