import { PropsWithChildren } from 'react';
import { redirect } from 'next/navigation';

import { EnhancedAuthService } from '@/features/account/controllers/enhanced-auth-service';

export default async function CreatorOnboardingLayout({ children }: PropsWithChildren) {
  // Only check if user is authenticated, not if onboarding is complete
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

  // If onboarding is already completed, redirect to dashboard
  if (userRole.onboardingCompleted === true) {
    redirect('/creator/dashboard');
  }

  // Allow access to onboarding pages
  return <>{children}</>;
}
