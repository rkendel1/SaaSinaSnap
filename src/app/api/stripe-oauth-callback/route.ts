import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { EnhancedAuthService } from '@/features/account/controllers/enhanced-auth-service';
import { updateCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { exchangeStripeOAuthCodeForTokens, extractProfileDataFromStripeAccount } from '@/features/creator-onboarding/controllers/stripe-connect';
import { updatePlatformSettings } from '@/features/platform-owner-onboarding/controllers/platform-settings';
import { getEnvVar } from '@/utils/get-env-var';
import { getURL } from '@/utils/get-url';
import { createServerClient } from '@supabase/ssr';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state'); // This is our "userId|flow|environment"

  if (code && !state) {
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

  if (!code || !state) {
    console.error('Stripe OAuth callback: Missing code or state parameter');
    return NextResponse.redirect(`${getURL()}/creator/onboarding?stripe_error=true`);
  }

  const stateParts = state.split('|');
  const [userId, flow, environment = 'test'] = stateParts;

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
      // This is the platform owner - save environment-specific credentials
      const updateData: any = {};
      
      if (environment === 'test') {
        updateData.stripe_test_account_id = stripeUserId;
        updateData.stripe_test_access_token = accessToken;
        updateData.stripe_test_refresh_token = refreshToken;
        updateData.stripe_test_enabled = true;
        updateData.stripe_environment = 'test'; // Set current environment
      } else { // environment === 'production'
        updateData.stripe_production_account_id = stripeUserId;
        updateData.stripe_production_access_token = accessToken;
        updateData.stripe_production_refresh_token = refreshToken;
        updateData.stripe_production_enabled = true;
        updateData.stripe_environment = 'production'; // Set current environment
      }
      
      await updatePlatformSettings(userId, updateData);
      
      // Revalidate paths for the platform owner
      revalidatePath('/platform-owner-onboarding');
      revalidatePath('/dashboard');
      // Redirect to platform owner onboarding
      return NextResponse.redirect(`${getURL()}/platform-owner-onboarding?stripe_success=true`);
    } else { // flow === 'creator'
      // This is a creator
      try {
        // Extract profile data from Stripe account for autopopulation
        const stripeProfileData = await extractProfileDataFromStripeAccount(stripeUserId);
        
        // Prepare update data based on environment
        const updateData: any = {
          // Auto-populate profile data from Stripe account (only if data exists)
          ...(Object.keys(stripeProfileData).length > 0 ? stripeProfileData : {}),
        };

        if (environment === 'test') {
          updateData.stripe_test_account_id = stripeUserId;
          updateData.stripe_test_access_token = accessToken;
          updateData.stripe_test_refresh_token = refreshToken;
          updateData.stripe_test_enabled = true;
          updateData.current_stripe_environment = 'test';
          // Maintain backward compatibility with legacy fields for test environment
          updateData.stripe_account_id = stripeUserId;
          updateData.stripe_access_token = accessToken;
          updateData.stripe_refresh_token = refreshToken;
          updateData.stripe_account_enabled = true;
        } else { // environment === 'production'
          updateData.stripe_production_account_id = stripeUserId;
          updateData.stripe_production_access_token = accessToken;
          updateData.stripe_production_refresh_token = refreshToken;
          updateData.stripe_production_enabled = true;
          updateData.current_stripe_environment = 'production';
          updateData.production_ready = true;
          updateData.production_launched_at = new Date().toISOString();
          // Update legacy fields to production for compatibility
          updateData.stripe_account_id = stripeUserId;
          updateData.stripe_access_token = accessToken;
          updateData.stripe_refresh_token = refreshToken;
          updateData.stripe_account_enabled = true;
        }
        
        // Update creator profile with environment-specific Stripe tokens and extracted data
        await updateCreatorProfile(userId, updateData);
        
        // Revalidate paths for the creator
        revalidatePath('/creator/onboarding');
        revalidatePath('/creator/dashboard');
        revalidatePath('/creator/profile');

        // Redirect with success indicator and environment info
        const dataImported = Object.keys(stripeProfileData).length > 0;
        const redirectUrl = `${getURL()}/creator/onboarding?stripe_success=true&environment=${environment}${dataImported ? '&data_imported=true' : ''}`;
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