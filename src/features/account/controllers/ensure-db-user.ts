'use server';

import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';

/**
 * Atomically ensures a user exists in the public.users table with the specified role.
 * This utility prevents redirect loops by guaranteeing the user record exists in the database
 * before role detection logic runs.
 * 
 * @param userId - The user's ID from auth.users
 * @param role - The role to assign to the user ('platform_owner', 'creator', or 'subscriber')
 * @returns Promise<{ success: boolean, error?: any }> - Operation result
 */
export async function ensureDbUser(
  userId: string,
  role: 'platform_owner' | 'creator' | 'subscriber'
): Promise<{ success: boolean; error?: any }> {
  console.log('[EnsureDbUser] Ensuring user exists in public.users:', { userId, role });

  try {
    const supabaseAdmin = await createSupabaseAdminClient();

    // Atomically upsert the user record in public.users table
    // This ensures the user exists with the correct role
    const { error: upsertError } = await supabaseAdmin
      .from('users')
      .upsert(
        { id: userId, role },
        { onConflict: 'id', ignoreDuplicates: false }
      );

    if (upsertError) {
      console.error('[EnsureDbUser] Error upserting user in public.users:', upsertError);
      return { success: false, error: upsertError };
    }

    console.log('[EnsureDbUser] Successfully ensured user exists in public.users with role:', role);

    // Also ensure the role is set in auth.users metadata for consistency
    const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { role },
    });

    if (metadataError) {
      console.error('[EnsureDbUser] Error updating auth.users metadata (non-fatal):', metadataError);
      // This is non-fatal - the DB record is the source of truth
      // We log the error but still return success since DB update worked
    } else {
      console.log('[EnsureDbUser] Successfully updated auth.users metadata with role:', role);
    }

    return { success: true };
  } catch (error) {
    console.error('[EnsureDbUser] Exception ensuring user in database:', error);
    return { success: false, error };
  }
}
