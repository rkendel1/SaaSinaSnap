import { NextRequest, NextResponse } from 'next/server';

import { updateSession } from '@/libs/supabase/supabase-middleware-client';
import { PLATFORM_TENANT_ID, resolveTenantFromRequest } from '@/libs/supabase/tenant-context';

export async function middleware(request: NextRequest) {
  // Extract host header for tenant resolution
  const host = request.headers.get('host');
  
  // First handle session update
  const sessionResponse = await updateSession(request);
  
  // If session update failed, return that response
  if (sessionResponse.status === 302 || sessionResponse.headers.get('location')) {
    return sessionResponse;
  }
  
  // Resolve tenant from the request host
  let tenantIdToSet: string | null = null;
  let tenantNameToSet: string = 'Unknown';

  if (host) {
    try {
      const tenant = await resolveTenantFromRequest(host);
      if (tenant) {
        tenantIdToSet = tenant.id;
        tenantNameToSet = tenant.name;
      }
    } catch (error) {
      console.error('Failed to resolve tenant in middleware:', error);
      // Continue with platform-level tenant if resolution fails
    }
  }
  
  // If no specific tenant is resolved, use the PLATFORM_TENANT_ID
  if (!tenantIdToSet) {
    tenantIdToSet = PLATFORM_TENANT_ID;
    tenantNameToSet = 'Platform';
  }

  // Always set x-tenant-id and x-tenant-name headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-tenant-id', tenantIdToSet);
  requestHeaders.set('x-tenant-name', tenantNameToSet);
  
  // Create modified request with tenant headers
  const modifiedRequest = new NextRequest(request.url, {
    headers: requestHeaders,
    method: request.method,
    body: request.body,
    referrer: request.referrer,
    referrerPolicy: request.referrerPolicy,
  });
  
  // Continue with the modified request
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
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