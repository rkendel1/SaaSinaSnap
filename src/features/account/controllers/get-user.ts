'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Tables } from '@/libs/supabase/types';

import { getSession } from './get-session'; // Import the updated getSession

export async function getUser(): Promise<Tables<'users'> | null> {
  const session = await getSession();

  if (!session?.user?.id) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  // Fetch the user's profile from the 'users' table using the authenticated user's ID.
  const { data, error } = await supabase.from('users').select('*').eq('id', session.user.id).maybeSingle();

  if (error) {
    console.error('Error fetching user profile:', error);
  }

  return data;
}