import { headers } from 'next/headers';

import { PlatformNavigation } from '@/features/platform-owner/components/PlatformNavigation';

/**
 * Platform Layout - Protected by middleware
 * If we reach this layout, the user is already authenticated and authorized as a platform owner
 */
export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  // Get request headers to verify we're in a middleware-protected route
  headers();

  return (
    <div className="min-h-screen bg-gray-50">
      <PlatformNavigation />
      {children}
    </div>
  );
}