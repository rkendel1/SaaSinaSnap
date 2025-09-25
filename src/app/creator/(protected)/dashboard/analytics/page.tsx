import { redirect } from 'next/navigation';
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Package, CheckCircle, AlertCircle, XCircle } from 'lucide-react'; // Added Calendar, Package, CheckCircle, AlertCircle, XCircle imports

import { getSession } from '@/features/account/controllers/get-session';
import { getCreatorDashboardStats } from '@/features/creator/controllers/get-creator-analytics';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { CreatorAnalyticsDashboard } from '@/features/creator/components/CreatorAnalyticsDashboard'; // Import the new component

export default async function AnalyticsPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const creatorProfile = await getCreatorProfile(session.user.id);

  if (!creatorProfile || !creatorProfile.onboarding_completed) {
    redirect('/creator/onboarding');
  }

  const dashboardStats = await getCreatorDashboardStats(session.user.id);

  return (
    <CreatorAnalyticsDashboard 
      creatorProfile={creatorProfile} 
      initialStats={dashboardStats} 
    />
  );
}