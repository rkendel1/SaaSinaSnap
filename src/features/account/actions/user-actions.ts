'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { Database } from '@/libs/supabase/types';
import { SupabaseClient } from '@supabase/supabase-js';

export async function deleteUserAction(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase: SupabaseClient<Database> = await createSupabaseServerClient();

    // Security check: Ensure the current user is a platform owner before proceeding.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || userProfile?.role !== 'platform_owner') {
      throw new Error('You do not have permission to delete users.');
    }

    // Invoke the Supabase Edge Function to delete the user
    const { error } = await supabase.functions.invoke('delete-user', {
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