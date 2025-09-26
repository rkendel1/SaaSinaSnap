import { NextRequest, NextResponse } from 'next/server';

import { updateSession } from '@/libs/supabase/supabase-middleware-client';
import { resolveTenantFromRequest } from '@/libs/supabase/tenant-context';

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
  if (host) {
    try {
      const tenant = await resolveTenantFromRequest(host);
      
      // If tenant is found, add it to request headers for downstream use
      if (tenant) {
        const requestHeaders = new Headers(request.headers);
        requestHeaders.set('x-tenant-id', tenant.id);
        requestHeaders.set('x-tenant-name', tenant.name);
        
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
    } catch (error) {
      console.error('Failed to resolve tenant:', error);
      // Continue without tenant context - may be a non-tenant route
    }
  }
  
  return sessionResponse;
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
