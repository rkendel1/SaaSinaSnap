'use server';

import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';

import type { CreatorProduct, CreatorProductInsert, CreatorProductUpdate } from '../types';
import type { ProductSearchOptions, ProductStatus } from '@/features/creator/types'; // Corrected import path

export async function getCreatorProducts(creatorId: string): Promise<CreatorProduct[]> {
  const supabaseAdmin = await createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('creator_products')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

// New function to get a single creator product by ID
export async function getCreatorProduct(productId: string): Promise<CreatorProduct | null> {
  const supabaseAdmin = await createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('creator_products')
    .select('*')
    .eq('id', productId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 means "no rows found"
    throw error;
  }

  return data || null;
}

// Enhanced search and filtering function
export async function searchCreatorProducts(
  creatorId: string, 
  options: ProductSearchOptions = {}
): Promise<{ products: CreatorProduct[], total: number }> {
  const supabaseAdmin = await createSupabaseAdminClient();
  let query = supabaseAdmin
    .from('creator_products')
    .select('*', { count: 'exact' })
    .eq('creator_id', creatorId);

  // Apply text search
  if (options.query) {
    query = query.or(`name.ilike.%${options.query}%,description.ilike.%${options.query}%`);
  }

  // Apply filters
  if (options.filters) {
    const { status, product_type, category, tags, price_range, created_after, created_before } = options.filters;
    
    if (status && status.length > 0) {
      // Handle different status types
      const conditions = status.map((s: ProductStatus) => {
        switch (s) {
          case 'active':
            return 'active.eq.true';
          case 'archived':
            return 'active.eq.false';
          case 'deleted':
            return 'metadata->deleted_at.not.is.null';
          default:
            return null;
        }
      }).filter(Boolean);
      
      if (conditions.length > 0) {
        query = query.or(conditions.join(','));
      }
    }

    if (product_type && product_type.length > 0) {
      query = query.in('product_type', product_type);
    }

    if (category) {
      query = query.like('metadata->category', `%${category}%`);
    }

    if (tags && tags.length > 0) {
      const tagConditions = tags.map((tag: string) => `metadata->tags.like.%${tag}%`);
      query = query.or(tagConditions.join(','));
    }

    if (price_range) {
      if (price_range.min !== undefined) {
        query = query.gte('price', price_range.min);
      }
      if (price_range.max !== undefined) {
        query = query.lte('price', price_range.max);
      }
    }

    if (created_after) {
      query = query.gte('created_at', created_after);
    }

    if (created_before) {
      query = query.lte('created_at', created_before);
    }
  }

  // Apply sorting
  const sortBy = options.sort_by || 'created_at';
  const sortOrder = options.sort_order || 'desc';
  query = query.order(sortBy, { ascending: sortOrder === 'asc' });

  // Apply pagination
  if (options.limit) {
    query = query.limit(options.limit);
  }
  if (options.offset) {
    query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1);
  }

  const { data, error, count } = await query;

  if (error) {
    throw error;
  }

  return {
    products: data || [],
    total: count || 0
  };
}

export async function createCreatorProduct(product: CreatorProductInsert): Promise<CreatorProduct> {
  const supabaseAdmin = await createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('creator_products')
    .insert(product)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateCreatorProduct(productId: string, updates: CreatorProductUpdate): Promise<CreatorProduct> {
  const supabaseAdmin = await createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('creator_products')
    .update(updates)
    .eq('id', productId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteCreatorProduct(productId: string): Promise<void> {
  const supabaseAdmin = await createSupabaseAdminClient();
  const { error } = await supabaseAdmin
    .from('creator_products')
    .delete()
    .eq('id', productId);

  if (error) {
    throw error;
  }
}

export async function getActiveCreatorProducts(creatorId: string): Promise<CreatorProduct[]> {
  const supabaseAdmin = await createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('creator_products')
    .select('*')
    .eq('creator_id', creatorId)
    .eq('active', true)
    .is('metadata->deleted_at', null) // Exclude soft-deleted products
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

// New function to get archived products
export async function getArchivedCreatorProducts(creatorId: string): Promise<CreatorProduct[]> {
  const supabaseAdmin = await createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('creator_products')
    .select('*')
    .eq('creator_id', creatorId)
    .eq('active', false)
    .is('metadata->deleted_at', null) // Exclude soft-deleted products
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

// New function to get deleted products (soft-deleted)
export async function getDeletedCreatorProducts(creatorId: string): Promise<CreatorProduct[]> {
  const supabaseAdmin = await createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('creator_products')
    .select('*')
    .eq('creator_id', creatorId)
    .not('metadata->deleted_at', 'is', null)
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

// Function to get product statistics
export async function getCreatorProductStats(creatorId: string): Promise<{
  total: number;
  active: number;
  archived: number;
  deleted: number;
}> {
  const supabaseAdmin = await createSupabaseAdminClient();
  const [total, active, archived, deleted] = await Promise.all([
    supabaseAdmin
      .from('creator_products')
      .select('id', { count: 'exact' })
      .eq('creator_id', creatorId),
    supabaseAdmin
      .from('creator_products')
      .select('id', { count: 'exact' })
      .eq('creator_id', creatorId)
      .eq('active', true)
      .is('metadata->deleted_at', null),
    supabaseAdmin
      .from('creator_products')
      .select('id', { count: 'exact' })
      .eq('creator_id', creatorId)
      .eq('active', false)
      .is('metadata->deleted_at', null),
    supabaseAdmin
      .from('creator_products')
      .select('id', { count: 'exact' })
      .eq('creator_id', creatorId)
      .not('metadata->deleted_at', 'is', null)
  ]);

  return {
    total: total.count || 0,
    active: active.count || 0,
    archived: archived.count || 0,
    deleted: deleted.count || 0
  };
}