import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { EnhancedAuthService } from '@/features/account/controllers/enhanced-auth-service';
import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { updateCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { exchangeStripeOAuthCodeForTokens, extractProfileDataFromStripeAccount } from '@/features/creator-onboarding/controllers/stripe-connect';
import { updatePlatformSettings } from '@/features/platform-owner-onboarding/controllers/platform-settings';
import { getEnvVar } from '@/utils/get-env-var';
import { getURL } from '@/utils/get-url';
import { type CookieOptions, createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state'); // This is our "userId|flow"

  if (code && !state) {
    // Supabase magic link auth flow
    const cookieStore = cookies();
    const supabase = createServerClient(
      getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL'),
      getEnvVar(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              console.warn('Cookie setting failed:', error);
            }
          },
          remove(name: string, options: CookieOptions) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              console.warn('Cookie removal failed:', error);
            }
          },
        },
      }
    );

    try {
      // Exchange code for session with timeout
      const exchangeResult = await Promise.race([
        supabase.auth.exchangeCodeForSession(code),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session exchange timeout')), 10000)
        )
      ]);

      if (exchangeResult && typeof exchangeResult === 'object' && 'error' in exchangeResult && exchangeResult.error) {
        throw exchangeResult.error;
      }
      
      // Use enhanced auth service to determine appropriate redirect with error handling
      try {
        const { redirectPath } = await EnhancedAuthService.getUserRoleAndRedirect();
        const finalRedirectPath = redirectPath || '/';
        
        return NextResponse.redirect(`${getURL()}${finalRedirectPath}`);
      } catch (authServiceError) {
        console.error('Auth service error during magic link:', authServiceError);
        // Fallback to basic redirect after successful auth
        return NextResponse.redirect(`${getURL()}/`);
      }
    } catch (error) {
      console.error('Supabase magic link auth error:', error);
      
      // Provide more specific error handling
      let errorMessage = 'magic_link_failed';
      if (error instanceof Error) {
        if (error.message.includes('timeout')) {
          errorMessage = 'magic_link_timeout';
        } else if (error.message.includes('expired')) {
          errorMessage = 'magic_link_expired';
        } else if (error.message.includes('invalid')) {
          errorMessage = 'magic_link_invalid';
        }
      }
      
      return NextResponse.redirect(`${getURL()}/login?error=${errorMessage}`);
    }
  }

  if (!code || !state) {
    console.error('Stripe OAuth callback: Missing code or state parameter');
    return NextResponse.redirect(`${getURL()}/creator/onboarding?stripe_error=true`);
  }

  const [userId, flow] = state.split('|');

  if (!userId || !flow) {
    console.error('Stripe OAuth callback: Invalid state parameter format');
    return NextResponse.redirect(`${getURL()}/creator/onboarding?stripe_error=true`);
  }

  try {
    const { accessToken, refreshToken, stripeUserId } = await exchangeStripeOAuthCodeForTokens(code);

    // Security check: Ensure the user from the state parameter is actually authenticated
    const authenticatedUser = await getAuthenticatedUser();
    if (!authenticatedUser || authenticatedUser.id !== userId) {
      console.error('Stripe OAuth callback: Authenticated user ID does not match state user ID.');
      return NextResponse.redirect(`${getURL()}/login?error=unauthorized_stripe_callback`);
    }

    if (flow === 'platform_owner') {
      // This is the platform owner - determine environment from the URL or use test as default
      const url = new URL(request.url);
      const environment = url.searchParams.get('env') === 'production' ? 'production' : 'test';
      
      // Build the update object based on environment
      const updateData: any = {
        stripe_environment: environment
      };
      
      if (environment === 'production') {
        updateData.stripe_production_account_id = stripeUserId;
        updateData.stripe_production_access_token = accessToken;
        updateData.stripe_production_refresh_token = refreshToken;
        updateData.stripe_production_enabled = true;
      } else {
        updateData.stripe_test_account_id = stripeUserId;
        updateData.stripe_test_access_token = accessToken;
        updateData.stripe_test_refresh_token = refreshToken;
        updateData.stripe_test_enabled = true;
      }
      
      await updatePlatformSettings(userId, updateData);
      
      // Revalidate paths for the platform owner
      revalidatePath('/platform-owner-onboarding');
      revalidatePath('/platform/dashboard');
      // Redirect to platform owner onboarding
      return NextResponse.redirect(`${getURL()}/platform-owner-onboarding?stripe_success=true&env=${environment}`);
    } else { // flow === 'creator'
      // This is a creator
      try {
        // Extract profile data from Stripe account for autopopulation
        const stripeProfileData = await extractProfileDataFromStripeAccount(stripeUserId);
        
        // For creators, we'll use test environment by default initially
        // Update creator profile with Stripe tokens and extracted data
        await updateCreatorProfile(userId, {
          stripe_test_account_id: stripeUserId,
          stripe_test_access_token: accessToken,
          stripe_test_refresh_token: refreshToken,
          stripe_test_enabled: true,
          stripe_account_enabled: true, // General flag
          // Auto-populate profile data from Stripe account (only if data exists)
          ...stripeProfileData, // Spread all extracted data
        });
        
        // Revalidate paths for the creator
        revalidatePath('/creator/onboarding');
        revalidatePath('/creator/dashboard');
        revalidatePath('/creator/profile');

        // Redirect with success indicator and data import status
        const dataImported = Object.keys(stripeProfileData).length > 0;
        const redirectUrl = `${getURL()}/creator/onboarding?stripe_success=true${dataImported ? '&data_imported=true' : ''}`;
        return NextResponse.redirect(redirectUrl);
      } catch (profileError) {
        console.error('Error updating creator profile with Stripe data:', profileError);
        // Still redirect to onboarding even if profile update fails, but revalidate
        revalidatePath('/creator/onboarding');
        return NextResponse.redirect(`${getURL()}/creator/onboarding?stripe_success=true&profile_update_error=true`);
      }
    }
  } catch (error) {
    console.error('Stripe OAuth callback error:', error);
    // Redirect to a generic error page or the last known onboarding step
    const errorRedirectUrl = flow === 'platform_owner' 
      ? `${getURL()}/platform-owner-onboarding?stripe_error=true`
      : `${getURL()}/creator/onboarding?stripe_error=true`;
    revalidatePath(errorRedirectUrl); // Revalidate the error path too
    return NextResponse.redirect(errorRedirectUrl);
  }
}