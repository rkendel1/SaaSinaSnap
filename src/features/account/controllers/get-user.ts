'use server';

import { headers } from 'next/headers';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Tables } from '@/libs/supabase/types';

import { getAuthenticatedUser } from './get-authenticated-user'; // Import the updated getAuthenticatedUser

// Helper to get tenantId from headers for server actions
function getTenantIdFromHeaders(): string | null {
  return headers().get('x-tenant-id');
}

export async function getUser(): Promise<Tables<'users'> | null> {
  const user = await getAuthenticatedUser(); // Use getAuthenticatedUser directly

  if (!user?.id) {
    return null;
  }

  const supabase = await createSupabaseServerClient();

  // Fetch the user's profile from the 'users' table using the authenticated user's ID.
  // RLS policies should handle filtering based on the session's app.current_tenant and the user's role.
  const { data, error } = await supabase.from('users').select('*').eq('id', user.id).maybeSingle();

  if (error) {
    console.error('Error fetching user profile:', error);
  }

  return data;
}