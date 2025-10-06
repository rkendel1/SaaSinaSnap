import { headers } from 'next/headers';
import Link from 'next/link';
import { TrendingUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AnalyticsDashboard } from '@/features/platform-owner/components/AnalyticsDashboard';

/**
 * Platform Analytics Page - Protected by middleware
 * If we reach this page, the user is already authenticated and authorized as a platform owner
 */
export default async function PlatformAnalyticsPage() {
  // Verify we're in a middleware-protected route
  headers();

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8 flex items-center justify-between">
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