'use server';

import { headers } from 'next/headers';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Tables } from '@/libs/supabase/types';

// Helper to get tenantId from headers for server actions
function getTenantIdFromHeaders(): string | null {
  return headers().get('x-tenant-id');
}

export async function deleteUserAction(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const tenantId = getTenantIdFromHeaders();
    if (!tenantId) throw new Error('Tenant context not found');

    const supabaseAdmin = await createSupabaseAdminClient(tenantId);

    // Security check: Ensure the current user is a platform owner before proceeding.
    const user = await getAuthenticatedUser(); // Use getAuthenticatedUser
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !(userProfile && typeof userProfile === 'object' && 'role' in userProfile && (userProfile as any).role === 'platform_owner')) {
      throw new Error('You do not have permission to delete users.');
    }

    // Invoke the Supabase Edge Function to delete the user
    const { error } = await supabaseAdmin.functions.invoke('delete-user', {
      body: { userId },
    });

    if (error) {
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting user:', error);
    return { success: false, error: error instanceof Error ? error.message : 'An unknown error occurred' };
  }
}