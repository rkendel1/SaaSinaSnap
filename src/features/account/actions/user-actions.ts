'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { Tables } from '@/libs/supabase/types';
import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser

export async function deleteUserAction(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient();
    const supabaseAdmin = await createSupabaseAdminClient();

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

    if (profileError || (userProfile as Tables<'users'>)?.role !== 'platform_owner') { // Explicitly cast userProfile
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