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

  return (
    <div className="min-h-screen bg-gray-50">
      <PlatformNavigation />
      {children}
    </div>
  );
}