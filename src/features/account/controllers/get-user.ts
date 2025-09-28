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

  const tenantId = getTenantIdFromHeaders();
  // If tenantId is null, it means we are likely on a non-tenant route (e.g., main platform pages)
  // In such cases, we can still fetch the user, but RLS might not apply.
  // For simplicity, we'll proceed without tenantId if it's not present.
  // If RLS is strictly enforced on 'users' table, this query might fail without tenant context.

  const supabase = await createSupabaseServerClient();

  // Fetch the user's profile from the 'users' table using the authenticated user's ID.
  let query = supabase.from('users').select('*').eq('id', user.id);

  // Conditionally apply tenant_id filter if available and valid
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (tenantId && uuidRegex.test(tenantId)) {
    query = query.eq('tenant_id', tenantId);
  } else {
    // If no valid tenantId, explicitly query for null tenant_id for platform-level users
    // This assumes platform_owners have tenant_id as null in the users table
    query = query.is('tenant_id', null);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    console.error('Error fetching user profile:', error);
  }

  return data;
}