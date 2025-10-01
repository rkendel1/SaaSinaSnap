import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { CreatorFeedbackDashboard } from '@/features/platform-owner/components/CreatorFeedbackDashboard';
import { getPlatformSettings } from '@/features/platform-owner-onboarding/controllers/get-platform-settings';

export const metadata = {
  title: 'Creator Feedback - Platform Dashboard',
  description: 'Monitor and respond to creator feedback',
};

export default async function CreatorFeedbackPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  // Check if user is platform owner
  const platformSettings = await getPlatformSettings();
  
  if (!platformSettings || platformSettings.owner_id !== authenticatedUser.id) {
    redirect('/creator/dashboard');
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <CreatorFeedbackDashboard />
    </div>
  );
}
