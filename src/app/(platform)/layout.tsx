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

  // If user is not a platform_owner, redirect them to their appropriate dashboard
  if (userRole.type !== 'platform_owner') {
    const { redirectPath } = await EnhancedAuthService.getUserRoleAndRedirect();
    if (redirectPath) {
      redirect(redirectPath);
    } else {
      redirect('/pricing'); // Fallback if no specific redirect path
    }
  }

  // If platform owner onboarding is not completed, redirect to onboarding
  // This layout protects routes under /(platform) group. The /platform-owner-onboarding
  // route is in a separate route group, so no infinite loop can occur.
  // The onboarding layout will allow access when onboarding is incomplete.
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