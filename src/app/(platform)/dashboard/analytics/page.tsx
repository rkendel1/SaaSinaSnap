import { redirect } from 'next/navigation';

import { EnhancedAuthService } from '@/features/account/controllers/enhanced-auth-service';
import { AnalyticsDashboard } from '@/features/platform-owner/components/AnalyticsDashboard';

export default async function PlatformAnalyticsPage() {
  // Use EnhancedAuthService for robust role detection that handles missing DB records
  const userRole = await EnhancedAuthService.getCurrentUserRole();

  if (userRole.type === 'unauthenticated') {
    redirect('/login');
  }
  
  // Verify user is platform_owner
  if (userRole.type !== 'platform_owner') {
    redirect('/login');
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Analytics Dashboard</h1>
        <p className="text-gray-600">Monitor platform performance, user engagement, and creator activity across your SaaSinaSnap platform.</p>
      </div>
      <AnalyticsDashboard />
    </div>
  );
}