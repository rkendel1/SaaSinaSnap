import { NextRequest, NextResponse } from 'next/server';

import { getPlatformTenantId, setTenantContext } from '@/libs/supabase/tenant-context';
import type { Database, Tables } from '@/libs/supabase/types';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  let tenantId: string | null = null;
  let tenantName = 'Platform';

  try {
    // Get platform tenant ID first for fallback
    const platformTenantId = await getPlatformTenantId();
    tenantId = platformTenantId;

    // Create Supabase client with proper error handling
    const supabase = createMiddlewareClient<Database>({ req, res });

    // Get session with timeout and error handling
    let session = null;
    try {
      const sessionResult = await supabase.auth.getSession();
      if (sessionResult.error) {
        console.warn('Session error (non-critical):', sessionResult.error.message);
      } else {
        session = sessionResult.data.session;
      }
    } catch (sessionError) {
      console.warn('Session retrieval failed (non-critical):', sessionError);
      // Continue without session - this is not a critical error
    }

    // Only attempt tenant resolution if we have a valid session
    if (session?.user) {
      try {
        const userTenantId = session.user.app_metadata?.tenant_id;

        if (userTenantId && userTenantId !== platformTenantId) {
          // Validate UUID format first
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(userTenantId)) {
            const { data: tenant, error: tenantError } = await supabase
              .from('tenants')
              .select('id, name')
              .eq('id', userTenantId)
              .eq('active', true)
              .maybeSingle();

            if (!tenantError && tenant) {
              const typedTenant = tenant as Tables<'tenants'> | null;
              if (typedTenant?.id) {
                tenantId = typedTenant.id;
                tenantName = typedTenant.name || 'Tenant';
              }
            } else if (tenantError && tenantError.code !== 'PGRST116') {
              console.warn('Non-critical tenant fetch error:', tenantError.message);
            }
          }
        }
      } catch (tenantResolutionError) {
        console.warn('Tenant resolution error (non-critical):', tenantResolutionError);
        // Continue with platform tenant - this is not a critical error
      }
    }

    // Safely set tenant context with error handling
    try {
      await setTenantContext(tenantId);
    } catch (contextError) {
      console.warn('Tenant context setting failed (non-critical):', contextError);
      // Continue - this is not a critical error for middleware
    }

  } catch (criticalError) {
    console.error('Critical middleware error:', criticalError);
    // Ensure we always have valid fallback values
    const platformTenantId = await getPlatformTenantId().catch(() => '00000000-0000-0000-0000-000000000000');
    tenantId = platformTenantId;
    tenantName = 'Platform';
    
    // Try to set context one more time with fallback
    try {
      await setTenantContext(tenantId);
    } catch {
      // If even the fallback fails, just continue
      console.warn('Fallback tenant context setting failed - continuing anyway');
    }
  }

  // Always set headers, even if there were errors
  if (tenantId) {
    res.headers.set('x-tenant-id', tenantId);
  }
  res.headers.set('x-tenant-name', tenantName);

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|login|api).*)',
  ],
};