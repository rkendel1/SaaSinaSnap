'use server';

import { headers } from 'next/headers';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { stripeAdmin } from '@/libs/stripe/stripe-admin'; // Correctly import stripeAdmin
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import type { Database } from '@/libs/supabase/types';

// Helper to get tenantId from headers for server actions
function getTenantIdFromHeaders(): string | null {
  return headers().get('x-tenant-id');
}

export async function getOrCreateCustomer({ userId, email }: { userId: string; email: string }) {
  const tenantId = getTenantIdFromHeaders();
  if (!tenantId) throw new Error('Tenant context not found');

  const supabaseAdmin = await createSupabaseAdminClient(tenantId);
  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single();

  if (error || !data?.stripe_customer_id) {
    // No customer record found, let's create one.
    const customerData = {
      email,
      metadata: {
        userId,
      },
    } as const;

    const customer = await stripeAdmin.customers.create(customerData);

    // Insert the customer ID into our Supabase mapping table.
    const { error: supabaseError } = await supabaseAdmin
      .from('customers')
      .insert([{ id: userId, stripe_customer_id: customer.id }]);

    if (supabaseError) {
      throw supabaseError;
    }

    return customer.id;
  }

  return data.stripe_customer_id;
}