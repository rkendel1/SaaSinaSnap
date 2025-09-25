import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

export async function getSession() {
  const supabase = await createSupabaseServerClient();

  // First, validate the user on the server to ensure the session is authentic
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // If there's a valid user, the session from the cookie is trusted.
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    console.error(error);
    return null;
  }

  return data.session;
}