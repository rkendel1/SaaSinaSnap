'use server';

// Removed: import { headers } from 'next/headers'; // Import headers

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { User } from '@supabase/supabase-js';

// Removed: Helper to get tenantId from headers for server actions
// Removed: function getTenantIdFromHeaders(): string | null {
// Removed:   return headers().get('x-tenant-id');
// Removed: }

export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  // This method authenticates the data by contacting the Supabase Auth server
  // and is safe to use in Server Components.
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Error fetching authenticated user:', error);
    return null;
  }

  return user;
}