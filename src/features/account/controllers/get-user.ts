import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Tables } from '@/libs/supabase/types';

import { getAuthenticatedUser } from './get-authenticated-user'; // Import the updated getAuthenticatedUser

export async function getUser(): Promise<Tables<'users'> | null> {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser?.id) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  // Fetch the user's profile from the 'users' table using the authenticated user's ID.
  const { data, error } = await supabase.from('users').select('*').eq('id', authenticatedUser.id).maybeSingle();

  if (error) {
    console.error('Error fetching user profile:', error);
  }

  return data;
}