'use server';

import { headers } from 'next/headers';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { getAuthenticatedUser } from './get-authenticated-user'; // Import getAuthenticatedUser



export async function getSubscription() {
  const user = await getAuthenticatedUser(); // Use getAuthenticatedUser

  if (!user?.id) {
    return null;
  }

 
  const supabase = await createSupabaseServerClient();

  let query = supabase
    .from('subscriptions')
    .select('*, prices(*, products(*))')
    .in('status', ['trialing', 'active'])
    .eq('user_id', user.id); // Filter by authenticated user's ID


  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error(error);
  }

  return data;
}