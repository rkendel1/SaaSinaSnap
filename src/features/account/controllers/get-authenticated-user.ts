'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { User } from '@supabase/supabase-js';

console.log('DEBUG: Loading getAuthenticatedUser server action module'); // Add this line

export async function getAuthenticatedUser(): Promise<User | null> {
  console.log('DEBUG: Calling getAuthenticatedUser function'); // Add this line
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Error fetching authenticated user:', error);
    return null;
  }

  return user;
}