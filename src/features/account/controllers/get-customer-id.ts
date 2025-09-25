'use server';

import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';

export async function getCustomerId({ userId }: { userId: string }) {
  const supabaseAdmin = await createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (error) {
    throw new Error('Error fetching stripe_customer_id');
  }

  return data.stripe_customer_id;
}