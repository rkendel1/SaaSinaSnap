import { PropsWithChildren } from 'react';
import { redirect } from 'next/navigation';

import { EnhancedAuthService } from '@/features/account/controllers/enhanced-auth-service';

export default async function PlatformOwnerOnboardingLayout({ children }: PropsWithChildren) {
  // Only check if user is authenticated
  const userRole = await EnhancedAuthService.getCurrentUserRole();

  // If user is not authenticated, redirect to login
  if (userRole.type === 'unauthenticated') {
    redirect('/login');
  }

  // Allow access to onboarding pages
  return <>{children}</>;
}
