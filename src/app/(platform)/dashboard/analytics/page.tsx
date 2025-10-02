import Link from 'next/link';
import { redirect } from 'next/navigation';
import { TrendingUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EnhancedAuthService } from '@/features/account/controllers/enhanced-auth-service';
import { AnalyticsDashboard } from '@/features/platform-owner/components/AnalyticsDashboard';

export default async function PlatformAnalyticsPage() {
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
      redirect('/pricing');
    }
  }

  // If platform owner onboarding is not completed, redirect to onboarding
  // This page is under /(platform) route group, so it won't cause a loop with
  // /platform-owner-onboarding which is in a different route group
  if (userRole.onboardingCompleted === false) {
    redirect('/platform-owner-onboarding');
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Monitor platform performance, user engagement, and creator activity across your SaaSinaSnap platform.</p>
        </div>
        <Link href="/dashboard/advanced-analytics">
          <Button variant="outline" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Advanced Analytics
          </Button>
        </Link>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}