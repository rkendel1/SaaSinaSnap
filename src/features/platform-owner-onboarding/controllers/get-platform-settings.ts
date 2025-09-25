'use server';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

import type { PlatformSettings } from '../types';

/**
 * Retrieves the platform settings.
 * Assumes there is only one platform settings record.
 */
export async function getPlatformSettings(): Promise<PlatformSettings | null> {
  const { data, error } = await supabaseAdminClient
    .from('platform_settings')
    .select('*')
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116: No rows found
    console.error('Error fetching platform settings:', error);
    return null; // Return null on error instead of throwing
  }

  return data;
}