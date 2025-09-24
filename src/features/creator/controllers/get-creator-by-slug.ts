import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { CreatorProfile } from '../types';

export async function getCreatorBySlug(slug: string): Promise<CreatorProfile | null> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('creator_profiles')
    .select('*')
    .eq('custom_domain', slug)
    .eq('onboarding_completed', true)
    .single();

  if (error) {
    console.error('Error fetching creator by slug:', error);
    return null;
  }

  return data as CreatorProfile;
}