import { redirect } from 'next/navigation';

import { EnhancedAuthService } from '@/features/account/controllers/enhanced-auth-service';
import { PlatformNavigation } from '@/features/platform-owner/components/PlatformNavigation';

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  // Use EnhancedAuthService for robust role detection
  const userRole = await EnhancedAuthService.getCurrentUserRole();

  // If user is not authenticated, redirect to login
  if (userRole.type === 'unauthenticated') {
    redirect('/login');
  }
  
  // If user is not a platform owner, redirect them to their appropriate dashboard
  if (userRole.type !== 'platform_owner') {
    // User has a role but it's not platform_owner
    const { redirectPath } = await EnhancedAuthService.getUserRoleAndRedirect();
    if (redirectPath) {
      redirect(redirectPath);
    } else {
      redirect('/pricing');
    }
  }

  // If onboarding is not completed, redirect to onboarding
  if (userRole.onboardingCompleted === false) {
    redirect('/platform-owner-onboarding');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PlatformNavigation />
      {children}
    </div>
  );
}