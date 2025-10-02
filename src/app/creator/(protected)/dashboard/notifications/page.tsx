import { redirect } from 'next/navigation';
import { AlertCircle, Bell, CheckCircle, Info } from 'lucide-react';

import { getSession } from '@/features/account/controllers/get-session';
import { NotificationsList } from '@/features/creator/components/NotificationsList';
import { getUserNotifications } from '@/features/creator/services/notification-service';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';

export default async function NotificationsPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const creatorProfile = await getCreatorProfile(session.user.id);

  if (!creatorProfile || !creatorProfile.onboarding_completed) {
    redirect('/creator/onboarding');
  }

  // Fetch real notifications from the database
  const notifications = await getUserNotifications(session.user.id, 50);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
        <p className="text-gray-600 mt-1">Stay updated with your platform activity</p>
      </div>

      <NotificationsList notifications={notifications} userId={session.user.id} />
    </div>
  );
}