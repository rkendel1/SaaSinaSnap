'use server';

import { unstable_noStore as noStore } from 'next/cache'; // Use unstable_noStore as noStore
import { headers } from 'next/headers';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Tables } from '@/libs/supabase/types';

import { getAuthenticatedUser } from './get-authenticated-user';


export async function getUser(): Promise<Tables<'users'> | null> {
  noStore(); // Ensure this function always fetches fresh data

  const user = await getAuthenticatedUser(); // Use getAuthenticatedUser directly

  if (!user?.id) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  // Fetch the user's profile from the 'users' table using the authenticated user's ID.
  const { data, error } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();

  if (error) {
    console.error('Error fetching user profile:', error);
  }

  return data;
}