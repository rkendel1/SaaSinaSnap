'use server';

import type { NextRequest } from 'next/server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Session } from '@supabase/supabase-js';

import { getAuthenticatedUser } from './get-authenticated-user'; // Import getAuthenticatedUser

export async function getSession(request: NextRequest): Promise<Session | null> {
  // Use getAuthenticatedUser to ensure the session data is authentic
  const user = await getAuthenticatedUser(request);
  if (!user) {
    return null;
  }

  // If user is authenticated, we can construct a minimal session object
  // or fetch the full session if absolutely necessary, but usually the user object is enough.
  // For now, we'll fetch the full session to maintain compatibility with existing code that expects a Session object.
  const supabase = await createSupabaseServerClient(request);
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('Error fetching session:', error);
    return null;
  }

  return session;
}
