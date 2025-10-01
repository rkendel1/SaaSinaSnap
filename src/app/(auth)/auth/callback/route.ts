import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { EnhancedAuthService } from '@/features/account/controllers/enhanced-auth-service';
import { ensureDbUser } from '@/features/account/controllers/ensure-db-user';
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

  console.log('[Auth Callback] Received request to /auth/callback');
  console.log(`[Auth Callback] Request URL: ${request.url}`);
  console.log(`[Auth Callback] Code parameter: ${code ? 'Present' : 'Missing'}`);

  if (!code) {
    console.error('[Auth Callback] Missing code parameter in URL.');
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
    console.log('[Auth Callback] Attempting to exchange code for session...');
    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
    
    if (sessionError) {
      console.error('[Auth Callback] Error exchanging code for session:', sessionError);
      return NextResponse.redirect(`${getURL()}/login?error=magic_link_failed&details=${sessionError.message}`);
    }

    if (!sessionData.session) {
      console.error('[Auth Callback] No session returned after code exchange.');
      return NextResponse.redirect(`${getURL()}/login?error=no_session_after_exchange`);
    }

    const authenticatedUser = sessionData.session.user;
    console.log(`[Auth Callback] Session successfully exchanged. User ID: ${authenticatedUser.id}`);

    // Determine if this is the first user to sign up (and thus the platform owner)
    console.log('[Auth Callback] Checking for existing platform settings...');
    const { data: anyPlatformSettings, error: anySettingsError } = await supabase.from('platform_settings').select('id').limit(1).single();
    
    let assignedRole: 'platform_owner' | 'subscriber' = 'subscriber';

    if (anySettingsError && anySettingsError.code === 'PGRST116') { // No rows found
      console.log('[Auth Callback] No platform settings found, this user is the first. Assigning platform_owner role.');
      assignedRole = 'platform_owner';
    } else if (anyPlatformSettings) {
      console.log('[Auth Callback] Platform settings already exist. Assigning subscriber role.');
      assignedRole = 'subscriber';
    }

    // Ensure the user exists in public.users and their auth.users metadata is updated with the determined role
    console.log(`[Auth Callback] Ensuring DB user and metadata for user ${authenticatedUser.id} with role: ${assignedRole}`);
    const ensureResult = await ensureDbUser(authenticatedUser.id, assignedRole);
    if (!ensureResult.success) {
      console.error('[Auth Callback] Failed to ensure user in DB or update metadata:', ensureResult.error);
      // Log error but continue, as the user might still be able to proceed
    }

    // If this is the first user, also create the platform settings record
    if (assignedRole === 'platform_owner') {
      try {
        await getOrCreatePlatformSettings(authenticatedUser.id);
        console.log('[Auth Callback] Successfully created platform settings for the first user.');
      } catch (createError) {
        console.error('[Auth Callback] Error creating platform settings for first user:', createError);
        // Log error but continue
      }
    }

    // Now, determine the appropriate redirect path. The user's role should be correctly set at this point.
    console.log('[Auth Callback] Determining redirect path for user:', authenticatedUser.id);
    const { redirectPath } = await EnhancedAuthService.getUserRoleAndRedirect();
    const finalRedirectPath = redirectPath || '/';
    
    console.log('[Auth Callback] Redirecting user to:', finalRedirectPath);
    return NextResponse.redirect(`${getURL()}${finalRedirectPath}`);
  } catch (error) {
    console.error('[Auth Callback] Supabase magic link auth error:', error);
    return NextResponse.redirect(`${getURL()}/login?error=magic_link_failed&details=${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}