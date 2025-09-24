import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

import type { WhiteLabeledPage, WhiteLabeledPageInsert, WhiteLabeledPageUpdate } from '../types';

export async function getWhiteLabeledPages(creatorId: string): Promise<WhiteLabeledPage[]> {
  const { data, error } = await supabaseAdminClient
    .from('white_labeled_pages')
    .select('*')
    .eq('creator_id', creatorId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getWhiteLabeledPage(creatorId: string, pageSlug: string): Promise<WhiteLabeledPage | null> {
  const { data, error } = await supabaseAdminClient
    .from('white_labeled_pages')
    .select('*')
    .eq('creator_id', creatorId)
    .eq('page_slug', pageSlug)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}

export async function createWhiteLabeledPage(page: WhiteLabeledPageInsert): Promise<WhiteLabeledPage> {
  const { data, error } = await supabaseAdminClient
    .from('white_labeled_pages')
    .insert(page)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function updateWhiteLabeledPage(pageId: string, updates: WhiteLabeledPageUpdate): Promise<WhiteLabeledPage> {
  const { data, error } = await supabaseAdminClient
    .from('white_labeled_pages')
    .update(updates)
    .eq('id', pageId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function deleteWhiteLabeledPage(pageId: string): Promise<void> {
  const { error } = await supabaseAdminClient
    .from('white_labeled_pages')
    .delete()
    .eq('id', pageId);

  if (error) {
    throw error;
  }
}

export async function getPublicWhiteLabeledPage(creatorId: string, pageSlug: string): Promise<WhiteLabeledPage | null> {
  const { data, error } = await supabaseAdminClient
    .from('white_labeled_pages')
    .select('*')
    .eq('creator_id', creatorId)
    .eq('page_slug', pageSlug)
    .eq('active', true)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  return data;
}