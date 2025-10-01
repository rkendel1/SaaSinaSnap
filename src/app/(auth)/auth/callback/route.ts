import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { EnhancedAuthService } from '@/features/account/controllers/enhanced-auth-service';
import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { getOrCreatePlatformSettings } from '@/features/platform-owner-onboarding/controllers/platform-settings';
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
    await supabase.auth.exchangeCodeForSession(code); // User is now authenticated
    
    const authenticatedUser = await getAuthenticatedUser(); // Get the newly authenticated user
    if (!authenticatedUser) {
      console.error('[Auth Callback] User not authenticated after code exchange');
      throw new Error('User not authenticated after code exchange');
    }

    console.log('[Auth Callback] User authenticated:', authenticatedUser.id);

    let hintRole: 'platform_owner' | undefined;

    // Check if any platform_settings exist. If not, this user is the first and should become the platform owner.
    const { data: anyPlatformSettings, error: anySettingsError } = await supabase.from('platform_settings').select('id').limit(1).single();
    
    if (anySettingsError && anySettingsError.code === 'PGRST116') { // PGRST116 means no rows found
      console.log('[Auth Callback] No platform settings found, creating for first user:', authenticatedUser.id);
      try {
        await getOrCreatePlatformSettings(authenticatedUser.id); // Create platform settings for this user
        hintRole = 'platform_owner'; // Set hint that this user is now platform owner
        console.log('[Auth Callback] Successfully created platform settings and assigned platform_owner role');
      } catch (createError) {
        console.error('[Auth Callback] Error creating platform settings:', createError);
        // Continue anyway - EnhancedAuthService will handle the redirect
      }
    } else if (anyPlatformSettings) {
      console.log('[Auth Callback] Platform settings already exist, user is not the first owner');
    }

    // Now, determine the appropriate redirect path. The platform_settings record should exist if this user is the owner.
    console.log('[Auth Callback] Determining redirect path for user:', authenticatedUser.id);
    const { redirectPath } = await EnhancedAuthService.getUserRoleAndRedirect();
    const finalRedirectPath = redirectPath || '/';
    
    console.log('[Auth Callback] Redirecting user to:', finalRedirectPath);
    return NextResponse.redirect(`${getURL()}${finalRedirectPath}`);
  } catch (error) {
    console.error('[Auth Callback] Supabase magic link auth error:', error);
    return NextResponse.redirect(`${getURL()}/login?error=magic_link_failed`);
  }
}