"use server"; // Mark this module as server-only

import { headers } from 'next/headers'; // Import headers

import type { Database } from '@/libs/supabase/types';
import { getEnvVar } from '@/utils/get-env-var';
import { createClient } from '@supabase/supabase-js';

import { PLATFORM_TENANT_ID, setTenantContext } from './tenant-context'; // Import setTenantContext and PLATFORM_TENANT_ID

// Log the environment variable to debug its availability
console.log('Initializing supabaseAdminClient. SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET');

export async function createSupabaseAdminClient(tenantId?: string) { // Make tenantId optional
  const supabase = createClient<Database>(
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar(process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY')
  );

  // Set the tenant context for the admin client.
  // If a specific tenantId is provided, use it. Otherwise, default to PLATFORM_TENANT_ID.
  // This ensures that even platform-level operations have a context, preventing the "unrecognized configuration parameter" error.
  await setTenantContext(tenantId || PLATFORM_TENANT_ID);

  return supabase;
}