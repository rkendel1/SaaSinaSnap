'use server';

import type { NextRequest } from 'next/server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { User } from '@supabase/supabase-js';

/**
 * Gets the authenticated user from Supabase.
 * Works in both server components and route handlers/middleware.
 * @param request - Optional NextRequest for route handlers/middleware
 */
export async function getAuthenticatedUser(request?: NextRequest): Promise<User | null> {
  console.log('[Auth Debug] Calling getAuthenticatedUser function');
  const supabase = await createSupabaseServerClient(request);
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error('[Auth Debug] Error fetching authenticated user:', error);
    return null;
  }

  if (user) {
    console.log(`[Auth Debug] getAuthenticatedUser: User found - ID: ${user.id}, Email: ${user.email}`);
  } else {
    console.log('[Auth Debug] getAuthenticatedUser: No user found (session missing)');
  }

  return user;
}