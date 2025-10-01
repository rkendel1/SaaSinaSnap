import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { getUser } from '@/features/account/controllers/get-user';
import { PlatformNavigation } from '@/features/platform-owner/components/PlatformNavigation';
import { Tables } from '@/libs/supabase/types';

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const authenticatedUser = await getAuthenticatedUser(); // Use getAuthenticatedUser

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  const user = await getUser(); // Fetch full user profile

  if (!user) {
    redirect('/login');
  }
  
  // Type guard to ensure user has role property
  const userWithRole = user as any;
  if (!userWithRole.role || userWithRole.role !== 'platform_owner') {
    // If the user is not a platform owner, redirect them to login or appropriate page
    // Platform owner routes are protected and only accessible to platform owners
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PlatformNavigation />
      {children}
    </div>
  );
}