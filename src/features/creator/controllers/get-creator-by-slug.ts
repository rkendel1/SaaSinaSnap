import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { CreatorProfile } from '../types';

export async function getCreatorBySlug(slug: string): Promise<CreatorProfile | null> {
  const supabase = await createSupabaseServerClient();

  let data: CreatorProfile | null = null;
  let error: any = null;

  // First, try to fetch by 'id' (UUID)
  const { data: idData, error: idError } = await supabase
    .from('creator_profiles')
    .select('*')
    .eq('id', slug)
    .eq('onboarding_completed', true)
    .single();

  if (idData) {
    return idData as CreatorProfile;
  }

  // If not found by 'id' and it's not a UUID, try to fetch by 'custom_domain'
  // A simple regex check for UUID format
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  if (!isUUID) {
    const { data: domainData, error: domainError } = await supabase
      .from('creator_profiles')
      .select('*')
      .eq('custom_domain', slug)
      .eq('onboarding_completed', true)
      .single();
    data = domainData;
    error = domainError;
  } else {
    // If it was a UUID and not found, and no custom domain check was performed,
    // then the error from the ID lookup is the relevant one.
    error = idError;
  }

  if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
    console.error('Error fetching creator by slug:', error);
  }

  return data as CreatorProfile;
}