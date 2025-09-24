import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Tables } from '@/libs/supabase/types';

export async function getUser(): Promise<Tables<'users'> | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.from('users').select('*').maybeSingle();

  if (error) {
    console.error(error);
  }

  return data;
}