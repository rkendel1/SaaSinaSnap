import { NextRequest, NextResponse } from 'next/server';

import { updateSession } from '@/libs/supabase/supabase-middleware-client';
import { PLATFORM_TENANT_ID, resolveTenantFromRequest } from '@/libs/supabase/tenant-context';
import { createClient } from '@supabase/supabase-js';

export const supabaseAdminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false, // prevents recursion
      persistSession: false,   // server doesn’t store sessions
    },
  }
);

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host');

  let tenantIdToSet = PLATFORM_TENANT_ID;
  let tenantNameToSet = 'Platform';

  try {
    const sessionResponse = await updateSession(request);

    // If updateSession returns a redirect response, return it immediately
    if (sessionResponse.status === 302 || sessionResponse.headers.get('location')) {
      return sessionResponse;
    }
  } catch (err) {
    // Gracefully handle missing or invalid sessions without throwing
    console.warn('Supabase session update failed or no valid session:', err);
  }

  // Resolve tenant safely
  if (host) {
    try {
      const tenant = await resolveTenantFromRequest(host);
      if (tenant) {
        tenantIdToSet = tenant.id;
        tenantNameToSet = tenant.name;
      }
    } catch (error) {
      console.error('Tenant resolution failed:', error);
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-id', tenantIdToSet);
  requestHeaders.set('x-tenant-name', tenantNameToSet);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};