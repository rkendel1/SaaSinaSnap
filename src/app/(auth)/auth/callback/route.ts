import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { EnhancedAuthService } from '@/features/account/controllers/enhanced-auth-service';
import { getEnvVar } from '@/utils/get-env-var';
import { getURL } from '@/utils/get-url';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

/**
 * Auth callback route for Supabase magic link authentication
 * Note: Stripe OAuth uses /api/stripe-oauth-callback instead
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (!code) {
    console.error('Auth callback: Missing code parameter');
    return NextResponse.redirect(`${getURL()}/login?error=missing_code`);
  }

  // Supabase magic link auth flow
  const cookieStore = cookies();
  const supabase = createServerClient(
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
    getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );
  
  try {
    await supabase.auth.exchangeCodeForSession(code);
    
    // Use enhanced auth service to determine appropriate redirect
    const { redirectPath } = await EnhancedAuthService.getUserRoleAndRedirect();
    const finalRedirectPath = redirectPath || '/';
    
    return NextResponse.redirect(`${getURL()}${finalRedirectPath}`);
  } catch (error) {
    console.error('Supabase magic link auth error:', error);
    return NextResponse.redirect(`${getURL()}/login?error=magic_link_failed`);
  }
}
