'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { Database } from '@/libs/supabase/types';
import { ActionResponse } from '@/types/action-response';
import { getEnvVar } from '@/utils/get-env-var';
import { getURL } from '@/utils/get-url';
import { createServerClient } from '@supabase/ssr';

export async function signInWithOAuth(provider: 'github' | 'google'): Promise<ActionResponse> {
  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getURL('/auth/callback'),
    },
  });

  if (error) {
    console.error(error);
    return { error: error.message };
  }

  return redirect(data.url);
}

export async function signInWithEmail(email: string): Promise<ActionResponse> {
  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: getURL('/auth/callback'),
    },
  });

  if (error) {
    console.error(error);
    return { error: error.message };
  }

  return { data: null };
}

export async function signOut(): Promise<ActionResponse> {
  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error(error);
    return { error: error.message };
  }

  return { data: null };
}