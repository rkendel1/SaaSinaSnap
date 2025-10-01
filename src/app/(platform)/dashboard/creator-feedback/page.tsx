import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { CreatorFeedbackDashboard } from '@/features/platform-owner/components/CreatorFeedbackDashboard';

export const metadata = {
  title: 'Creator Feedback - Platform Dashboard',
  description: 'Monitor and respond to creator feedback',
};

export default async function CreatorFeedbackPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <CreatorFeedbackDashboard />
    </div>
  );
}
