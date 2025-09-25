'use server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { Tables } from '@/libs/supabase/types';

/**
 * Fetches all users except the currently authenticated platform owner.
 * This is an admin-level function and should only be called from a secure context.
 */
export async function getAllUsers(): Promise<Tables<'users'>[]> {
  const platformOwner = await getAuthenticatedUser();
  if (!platformOwner) {
    throw new Error('Not authenticated');
  }

  const { data, error } = await supabaseAdminClient
    .from('users')
    .select('*')
    .neq('id', platformOwner.id) // Exclude the platform owner from the list
    .order('role', { ascending: true });

  if (error) {
    console.error('Error fetching all users:', error);
    throw new Error('Failed to fetch users.');
  }

  return data || [];
}