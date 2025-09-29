import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import type { Database, Tables } from '@/libs/supabase/types'; // Import Tables type
import { getPlatformTenantId, setTenantContext } from '@/libs/supabase/tenant-context'; // Import getPlatformTenantId and setTenantContext

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient<Database>({ req, res });

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) console.error('Error getting session:', sessionError);

  let tenantId: string | null = null;
  let tenantName = 'Unknown';

  try {
    const platformTenantId = await getPlatformTenantId(); // Get the platform tenant ID

    if (session?.user) {
      // Try to get the user's assigned tenant
      const userTenantId = session.user.app_metadata?.tenant_id;

      if (userTenantId) {
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .select('id, name')
          .eq('id', userTenantId)
          .maybeSingle();

        if (tenantError) console.error('Error fetching user tenant:', tenantError);
        
        const typedTenant = tenant as Tables<'tenants'> | null;
        if (typedTenant) {
          tenantId = typedTenant.id;
          tenantName = typedTenant.name;
        }
      }
    }

    // If no specific tenant is found for the user, or if the user's tenant is the platform tenant,
    // default to the platform tenant.
    if (!tenantId || tenantId === platformTenantId) {
      tenantId = platformTenantId;
      tenantName = 'Platform'; // Default name for the platform tenant
    }
    
    // Set the tenant context for the current request
    await setTenantContext(tenantId);

  } catch (err) {
    console.error('Middleware tenant/session error:', err);
    // Fallback to platform tenant if any error occurs during tenant resolution
    const platformTenantId = await getPlatformTenantId();
    tenantId = platformTenantId;
    tenantName = 'Platform';
    await setTenantContext(tenantId);
  }

  if (tenantId) res.headers.set('x-tenant-id', tenantId);
  res.headers.set('x-tenant-name', tenantName);

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|login|api).*)',
  ],
};