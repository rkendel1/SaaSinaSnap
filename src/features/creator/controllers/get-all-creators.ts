'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import type { CreatorProfile } from '../types';

export interface CreatorDirectoryFilters {
  query?: string;
  category?: string;
  minRating?: number;
  verified?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'featured' | 'rating' | 'newest' | 'popular' | 'alphabetical';
}

export interface CreatorDirectoryResult {
  creators: (CreatorProfile & { 
    stats?: {
      products: number;
      reviews: number;
      rating: number;
    };
  })[];
  total: number;
  hasMore: boolean;
}

/**
 * Get all creators for the directory with optional filtering and sorting
 */
export async function getAllCreators(filters: CreatorDirectoryFilters = {}): Promise<CreatorDirectoryResult> {
  const supabase = await createSupabaseServerClient();
  
  const {
    query,
    category,
    minRating = 0,
    verified = false,
    limit = 50,
    offset = 0,
    sortBy = 'featured'
  } = filters;

  let queryBuilder = supabase
    .from('creator_profiles')
    .select(`
      *,
      creator_products!inner(count),
      creator_analytics(
        average_rating,
        total_reviews
      )
    `)
    .eq('onboarding_completed', true)
    .eq('stripe_account_enabled', true);

  // Apply search filter
  if (query?.trim()) {
    queryBuilder = queryBuilder.or(
      `business_name.ilike.%${query}%,business_description.ilike.%${query}%`
    );
  }

  // Apply verified filter
  if (verified) {
    queryBuilder = queryBuilder.not('business_website', 'is', null);
  }

  // Apply sorting
  switch (sortBy) {
    case 'rating':
      queryBuilder = queryBuilder.order('average_rating', { ascending: false, nullsLast: true });
      break;
    case 'newest':
      queryBuilder = queryBuilder.order('created_at', { ascending: false });
      break;
    case 'popular':
      queryBuilder = queryBuilder.order('total_reviews', { ascending: false, nullsLast: true });
      break;
    case 'alphabetical':
      queryBuilder = queryBuilder.order('business_name', { ascending: true });
      break;
    default:
      // Featured - order by a combination of factors
      queryBuilder = queryBuilder.order('stripe_account_enabled', { ascending: false });
      break;
  }

  // Apply pagination
  queryBuilder = queryBuilder.range(offset, offset + limit - 1);

  const { data, error, count } = await queryBuilder;

  if (error) {
    console.error('Error fetching creators:', error);
    return {
      creators: [],
      total: 0,
      hasMore: false,
    };
  }

  // Transform the data to include stats
  const creators = (data || []).map(creator => ({
    ...creator,
    stats: {
      products: creator.creator_products?.length || 0,
      reviews: creator.creator_analytics?.total_reviews || 0,
      rating: creator.creator_analytics?.average_rating || 0,
    },
  }));

  return {
    creators,
    total: count || 0,
    hasMore: (offset + limit) < (count || 0),
  };
}

/**
 * Get featured creators for homepage or promotional purposes
 */
export async function getFeaturedCreators(limit = 6): Promise<CreatorProfile[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('creator_profiles')
    .select('*')
    .eq('onboarding_completed', true)
    .eq('stripe_account_enabled', true)
    .not('business_logo_url', 'is', null) // Prefer creators with logos
    .not('business_description', 'is', null) // And descriptions
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching featured creators:', error);
    return [];
  }

  return data as CreatorProfile[] || [];
}

/**
 * Get creator stats for analytics
 */
export async function getCreatorDirectoryStats(): Promise<{
  totalCreators: number;
  totalProducts: number;
  totalCategories: number;
  averageRating: number;
}> {
  const supabase = await createSupabaseServerClient();

  const [creatorsCount, productsCount] = await Promise.all([
    supabase
      .from('creator_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('onboarding_completed', true),
    
    supabase
      .from('creator_products')
      .select('*', { count: 'exact', head: true })
      .eq('active', true)
  ]);

  return {
    totalCreators: creatorsCount.count || 0,
    totalProducts: productsCount.count || 0,
    totalCategories: 12, // Mock value - in a real app, this would be dynamic
    averageRating: 4.7, // Mock value - in a real app, this would be calculated
  };
}