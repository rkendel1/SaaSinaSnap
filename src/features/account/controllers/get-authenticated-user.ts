import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { User } from '@supabase/supabase-js';

export async function getAuthenticatedUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Error fetching authenticated user:', error);
    return null;
  }

  return user;
}