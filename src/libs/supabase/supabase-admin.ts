'use server'; // Mark this module as server-only

import { headers } from 'next/headers'; // Import headers

import type { Database } from '@/libs/supabase/types';
import { getEnvVar } from '@/utils/get-env-var';
import { createClient } from '@supabase/supabase-js';

import { setTenantContext } from './tenant-context';

// Log the environment variable to debug its availability
console.log('Initializing supabaseAdminClient. SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');

export async function createSupabaseAdminClient() { // Removed tenantId parameter
  const supabase = createClient<Database>(
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar(process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY')
  );

  // Always get tenantId from headers and set context
  const headersList = headers();
  const tenantIdFromHeaders = headersList.get('x-tenant-id');
  
  // Set tenant context, even if it's the PLATFORM_TENANT_ID or null
  await setTenantContext(tenantIdFromHeaders);

  return supabase;
}