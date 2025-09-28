'use server'; // Mark this module as server-only

import type { Database } from '@/libs/supabase/types';
import { getEnvVar } from '@/utils/get-env-var';
import { createClient } from '@supabase/supabase-js';

import { setTenantContext } from './tenant-context';

// Log the environment variable to debug its availability
console.log('Initializing supabaseAdminClient. SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');

export async function createSupabaseAdminClient(tenantId?: string | null) { // Allow null for tenantId
  const supabase = createClient<Database>(
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar(process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY')
  );

  if (tenantId) { // Only call setTenantContext if tenantId is a truthy string
    await setTenantContext(tenantId);
  }

  return supabase;
}