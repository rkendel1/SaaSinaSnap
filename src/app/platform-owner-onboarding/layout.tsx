import { PropsWithChildren } from 'react';
import { redirect } from 'next/navigation';

import { EnhancedAuthService } from '@/features/account/controllers/enhanced-auth-service';

export default async function PlatformOwnerOnboardingLayout({ children }: PropsWithChildren) {
  // Use EnhancedAuthService for robust role detection
  const userRole = await EnhancedAuthService.getCurrentUserRole();

  // If user is not authenticated, redirect to login
  if (userRole.type === 'unauthenticated') {
    redirect('/login');
  }

  // If user is not a platform_owner, redirect them to their appropriate dashboard
  if (userRole.type !== 'platform_owner') {
    const { redirectPath } = await EnhancedAuthService.getUserRoleAndRedirect();
    if (redirectPath) {
      redirect(redirectPath);
    } else {
      redirect('/pricing'); // Fallback if no specific redirect path
    }
  }

  // If platform owner onboarding is already completed, redirect to dashboard
  if (userRole.onboardingCompleted === true) {
    redirect('/dashboard');
  }

  // Allow access to onboarding pages
  return <>{children}</>;
}