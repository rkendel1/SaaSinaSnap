'use server';

import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export type NotificationType = 'success' | 'info' | 'warning' | 'error';

export interface Notification {
  id: string;
  user_id: string;
  creator_id?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Create a new notification
 */
export async function createNotification({
  userId,
  creatorId,
  type,
  title,
  message,
  link,
}: {
  userId: string;
  creatorId?: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  try {
    const supabase = await createSupabaseAdminClient();
    
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        creator_id: creatorId,
        type,
        title,
        message,
        link,
        read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true, notificationId: data.id };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get all notifications for a user
 */
export async function getUserNotifications(
  userId: string,
  limit = 50,
  offset = 0
): Promise<Notification[]> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllNotificationsAsRead(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      console.error('Error deleting notification:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(
  userId: string
): Promise<number> {
  try {
    const supabase = await createSupabaseServerClient();
    
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
}

/**
 * Create notification for subscription renewal
 */
export async function notifySubscriptionRenewal(
  userId: string,
  creatorId: string,
  productName: string,
  amount: string
): Promise<void> {
  await createNotification({
    userId,
    creatorId,
    type: 'success',
    title: 'Subscription Renewed',
    message: `Your subscription to ${productName} has been renewed successfully for ${amount}.`,
    link: '/dashboard/subscriptions',
  });
}

/**
 * Create notification for feature update
 */
export async function notifyFeatureUpdate(
  userId: string,
  creatorId: string,
  featureTitle: string,
  featureDescription: string
): Promise<void> {
  await createNotification({
    userId,
    creatorId,
    type: 'info',
    title: `New Feature: ${featureTitle}`,
    message: featureDescription,
    link: '/dashboard',
  });
}

/**
 * Create notification for payment failure
 */
export async function notifyPaymentFailure(
  userId: string,
  creatorId: string,
  productName: string
): Promise<void> {
  await createNotification({
    userId,
    creatorId,
    type: 'warning',
    title: 'Payment Failed',
    message: `Your payment for ${productName} has failed. Please update your payment method.`,
    link: '/dashboard/billing',
  });
}
