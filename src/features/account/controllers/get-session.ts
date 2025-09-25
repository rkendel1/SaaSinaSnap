import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Session } from '@supabase/supabase-js';

export async function getSession(): Promise<Session | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { session }, error } = await supabase.auth.getSession();

  if (error) {
    console.error('Error fetching session:', error);
    return null;
  }

  return session;
}