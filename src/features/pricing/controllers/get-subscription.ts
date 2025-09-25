'use server';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function getSubscription() {
  const user = await getAuthenticatedUser(); // Use getAuthenticatedUser

  if (!user?.id) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('subscriptions')
    .select('*, prices(*, products(*))')
    .in('status', ['trialing', 'active'])
    .eq('user_id', user.id) // Filter by authenticated user's ID
    .maybeSingle();

  if (error) {
    console.error(error);
  }

  return data;
}