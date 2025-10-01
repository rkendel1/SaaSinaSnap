import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { CreatorProfile } from '../types';

export async function getCreatorBySlug(slug: string, isPreview: boolean = false): Promise<CreatorProfile | null> {
  const supabase = await createSupabaseServerClient();

  // Query by 'custom_domain' which contains the creator's unique slug or UUID.
  let query = supabase
    .from('creator_profiles')
    .select('*')
    .eq('custom_domain', slug);
  
  if (!isPreview) { // Only apply onboarding_completed filter if not in preview mode
    query = query.eq('onboarding_completed', true);
  }

  const { data, error } = await query.single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
    console.error('Error fetching creator by slug:', error);
  }

  return data as CreatorProfile | null;
}