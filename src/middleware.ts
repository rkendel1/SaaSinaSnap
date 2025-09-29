import { NextRequest, NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import type { Database, Tables } from '@/libs/supabase/types'; // Import Tables type

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
    if (session?.user) {
      // Correct usage: 'tenants' is a string literal.
      // The return type will be inferred as Tables<'tenants'> | null.
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .select('id, name')
        .eq('id', session.user.app_metadata?.tenant_id)
        .maybeSingle();

      if (tenantError) console.error('Error fetching tenant:', tenantError);
      // Cast to Tables<'tenants'> to ensure 'id' and 'name' properties exist
      const typedTenant = tenant as Tables<'tenants'> | null;
      if (typedTenant) {
        tenantId = typedTenant.id;
        tenantName = typedTenant.name;
      }
    }

    // Fallback to platform tenant
    if (!tenantId) {
      // Correct usage: 'tenants' is a string literal.
      // The return type will be inferred as Tables<'tenants'> | null.
      const { data: platformTenant, error: platformError } = await supabase
        .from('tenants')
        .select('id, name, is_platform')
        .eq('is_platform', true)
        .maybeSingle();

      if (platformError) console.error('Error fetching platform tenant:', platformError);
      // Cast to Tables<'tenants'> to ensure 'id' and 'name' properties exist
      const typedPlatformTenant = platformTenant as Tables<'tenants'> | null;
      if (typedPlatformTenant) {
        tenantId = typedPlatformTenant.id;
        tenantName = typedPlatformTenant.name ?? 'Platform';
      } else {
        tenantName = 'Platform';
      }
    }
  } catch (err) {
    console.error('Middleware tenant/session error:', err);
  }

  if (tenantId) res.headers.set('x-tenant-id', tenantId);
  res.headers.set('x-tenant-name', tenantName);

  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(svg|png|jpg|jpeg|gif|webp)$|login|api).*)',
  ],
};