'use client';

import React from 'react';
import { AlertCircle, AlertTriangle,CheckCircle, Info, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  dismissible?: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

interface CustomerNotificationsProps {
  notifications: Notification[];
  onDismiss?: (id: string) => void;
}

export function CustomerNotifications({ notifications, onDismiss }: CustomerNotificationsProps) {
  if (notifications.length === 0) {
    return null;
  }

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getStyles = (type: Notification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="space-y-3 mb-6">
      {notifications.map((notification) => (
        <Card key={notification.id} className={`border ${getStyles(notification.type)}`}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {getIcon(notification.type)}
              
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-gray-900">
                  {notification.title}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {notification.message}
                </p>
                
                {notification.actionLabel && notification.onAction && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    onClick={notification.onAction}
                  >
                    {notification.actionLabel}
                  </Button>
                )}
              </div>

              {notification.dismissible && onDismiss && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="p-1 h-auto"
                  onClick={() => onDismiss(notification.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Sample notifications for demo purposes
export const sampleNotifications: Notification[] = [
  {
    id: '1',
    type: 'warning',
    title: 'Usage Alert',
    message: 'You\'re approaching 85% of your API call limit for this month. Consider upgrading your plan.',
    dismissible: true,
    actionLabel: 'Upgrade Plan',
    onAction: () => console.log('Upgrade plan clicked'),
  },
  {
    id: '2',
    type: 'info',
    title: 'New Feature Available',
    message: 'We\'ve added advanced analytics to your dashboard. Check it out!',
    dismissible: true,
    actionLabel: 'Learn More',
    onAction: () => console.log('Learn more clicked'),
  },
  {
    id: '3',
    type: 'success',
    title: 'Payment Successful',
    message: 'Your monthly subscription payment of $29.00 has been processed successfully.',
    dismissible: true,
  },
];