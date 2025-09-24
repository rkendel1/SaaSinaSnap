import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { CreatorProfile } from '../types';

export async function getCreatorBySlug(slug: string, isPreview: boolean = false): Promise<CreatorProfile | null> {
  const supabase = await createSupabaseServerClient();

  let data: CreatorProfile | null = null;
  let error: any = null;

  // First, try to fetch by 'id' (UUID)
  let queryById = supabase
    .from('creator_profiles')
    .select('*')
    .eq('id', slug);
  
  if (!isPreview) { // Only apply onboarding_completed filter if not in preview mode
    queryById = queryById.eq('onboarding_completed', true);
  }

  const { data: idData, error: idError } = await queryById.single();

  if (idData) {
    return idData as CreatorProfile;
  }

  // If not found by 'id' and it's not a UUID, try to fetch by 'custom_domain'
  // A simple regex check for UUID format
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  if (!isUUID) {
    let queryByDomain = supabase
      .from('creator_profiles')
      .select('*')
      .eq('custom_domain', slug);

    if (!isPreview) { // Only apply onboarding_completed filter if not in preview mode
      queryByDomain = queryByDomain.eq('onboarding_completed', true);
    }

    const { data: domainData, error: domainError } = await queryByDomain.single();
    data = domainData as CreatorProfile; // Cast here
    error = domainError;
  } else {
    error = idError;
  }

  if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
    console.error('Error fetching creator by slug:', error);
  }

  return data;
}