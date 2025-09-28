'use server';

import { cookies, headers } from 'next/headers'; // Import headers
import { Database } from '@/libs/supabase/types';
import { getEnvVar } from '@/utils/get-env-var';
import { createServerClient } from '@supabase/ssr';
import { setTenantContext } from './tenant-context'; // Import setTenantContext

export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        // For Server Components, we only need to read cookies, not write them.
        // The middleware will handle session refreshing.
      },
    }
  );

  // Always get tenantId from headers and set context for this client's session
  const headersList = headers();
  const tenantIdFromHeaders = headersList.get('x-tenant-id');
  
  // Set tenant context, even if it's the PLATFORM_TENANT_ID or null
  await setTenantContext(tenantIdFromHeaders);

  return supabase;
}