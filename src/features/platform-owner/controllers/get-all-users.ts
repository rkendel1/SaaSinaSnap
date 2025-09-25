'use server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

import { PlatformUser } from '../types/index';

export async function getAllUsers(): Promise<PlatformUser[]> {
  const platformOwner = await getAuthenticatedUser();
  if (!platformOwner) {
    throw new Error('Not authenticated');
  }

  // 1. Get all users from auth.users
  const { data: authUsersData, error: authUsersError } = await supabaseAdminClient.auth.admin.listUsers();
  if (authUsersError) {
    console.error('Error fetching auth users:', authUsersError);
    throw new Error('Failed to fetch users.');
  }
  const authUsers = authUsersData.users.filter(u => u.id !== platformOwner.id);
  const authUsersMap = new Map(authUsers.map(u => [u.id, u]));

  // 2. Get all profiles from public.users
  const { data: profilesData, error: profilesError } = await supabaseAdminClient
    .from('users')
    .select('*')
    .neq('id', platformOwner.id);
  
  if (profilesError) {
    console.error('Error fetching user profiles:', profilesError);
    throw new Error('Failed to fetch user profiles.');
  }

  // 3. Merge them
  const mergedUsers: PlatformUser[] = profilesData.map(profile => {
    const authUser = authUsersMap.get(profile.id);
    return {
      ...profile,
      email: authUser?.email,
      created_at: authUser?.created_at || new Date().toISOString(),
      last_sign_in_at: authUser?.last_sign_in_at,
    };
  });

  // Sort by role
  mergedUsers.sort((a, b) => (a.role || '').localeCompare(b.role || ''));

  return mergedUsers;
}