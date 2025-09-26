import { redirect } from 'next/navigation';
import { AlertCircle, Bell, CheckCircle, Info } from 'lucide-react';

import { getSession } from '@/features/account/controllers/get-session';
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

  // Mock notifications for demonstration
  const notifications = [
    {
      id: 1,
      type: 'success',
      title: 'Product Created Successfully',
      message: 'Your new product "Premium Course" has been created and is now live.',
      time: '2 hours ago',
      read: false,
    },
    {
      id: 2,
      type: 'info',
      title: 'New Embed Asset Available',
      message: 'Check out the new pricing table template in the Design Studio.',
      time: '1 day ago',
      read: false,
    },
    {
      id: 3,
      type: 'warning',
      title: 'Payment Setup Required',
      message: 'Complete your Stripe setup to start accepting payments.',
      time: '3 days ago',
      read: true,
    },
  ];

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

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Recent Notifications</h2>
            <button className="text-sm text-blue-600 hover:text-blue-800">
              Mark all as read
            </button>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-6 hover:bg-gray-50 transition-colors ${
                !notification.read ? 'bg-blue-50/30' : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </h3>
                    <span className="text-xs text-gray-500">{notification.time}</span>
                  </div>
                  <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                  {!notification.read && (
                    <div className="mt-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        New
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {notifications.length === 0 && (
          <div className="p-12 text-center">
            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No notifications</h3>
            <p className="text-gray-600">
              When you have new updates, they&apos;ll appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}