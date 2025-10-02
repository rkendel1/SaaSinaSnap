'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Bell, CheckCircle, Info, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { 
  deleteNotification,
  markAllNotificationsAsRead, 
  markNotificationAsRead, 
  type Notification 
} from '@/features/creator/services/notification-service';

interface NotificationsListProps {
  notifications: Notification[];
  userId: string;
}

export function NotificationsList({ notifications: initialNotifications, userId }: NotificationsListProps) {
  const [notifications, setNotifications] = useState(initialNotifications);

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      case 'info':
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  const handleMarkAsRead = async (notificationId: string) => {
    const result = await markNotificationAsRead(notificationId);
    if (result.success) {
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } else {
      toast({
        variant: 'destructive',
        description: 'Failed to mark notification as read',
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    const result = await markAllNotificationsAsRead(userId);
    if (result.success) {
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      toast({
        description: 'All notifications marked as read',
      });
    } else {
      toast({
        variant: 'destructive',
        description: 'Failed to mark all notifications as read',
      });
    }
  };

  const handleDelete = async (notificationId: string) => {
    const result = await deleteNotification(notificationId);
    if (result.success) {
      setNotifications(notifications.filter(n => n.id !== notificationId));
      toast({
        description: 'Notification deleted',
      });
    } else {
      toast({
        variant: 'destructive',
        description: 'Failed to delete notification',
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Recent Notifications</h2>
            {unreadCount > 0 && (
              <p className="text-sm text-gray-600 mt-1">
                You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
            >
              Mark all as read
            </Button>
          )}
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">
                      {formatDate(notification.created_at)}
                    </span>
                    <button
                      onClick={() => handleDelete(notification.id)}
                      className="text-gray-400 hover:text-gray-600"
                      title="Delete notification"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-600">{notification.message}</p>
                <div className="mt-2 flex items-center gap-3">
                  {!notification.read && (
                    <>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        New
                      </span>
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        Mark as read
                      </button>
                    </>
                  )}
                  {notification.link && (
                    <Link
                      href={notification.link}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      View details →
                    </Link>
                  )}
                </div>
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
  );
}
