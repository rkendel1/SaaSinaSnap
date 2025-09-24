import { NextRequest, NextResponse } from 'next/server';

import { exchangeStripeOAuthCodeForTokens } from '@/features/creator-onboarding/controllers/stripe-connect';
import { updateCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { updatePlatformSettings } from '@/features/platform-owner-onboarding/controllers/platform-settings';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { getURL } from '@/utils/get-url';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const userId = requestUrl.searchParams.get('state'); // This is our userId

  if (!code || !userId) {
    console.error('Stripe OAuth callback: Missing code or state (userId) parameter');
    return NextResponse.redirect(`${getURL()}/creator/onboarding?stripe_error=true`);
  }

  try {
    const { accessToken, refreshToken, stripeUserId } = await exchangeStripeOAuthCodeForTokens(code);

    // Check if this user is a platform owner
    const { data: platformSettings } = await supabaseAdminClient
      .from('platform_settings')
      .select('owner_id')
      .eq('owner_id', userId)
      .single();

    if (platformSettings) {
      // This is the platform owner
      await updatePlatformSettings(userId, {
        stripe_account_id: stripeUserId,
        stripe_access_token: accessToken,
        stripe_refresh_token: refreshToken,
        stripe_account_enabled: true,
      });
      // Redirect to platform owner onboarding
      return NextResponse.redirect(`${getURL()}/platform-owner-onboarding?stripe_success=true`);
    } else {
      // This is a creator
      await updateCreatorProfile(userId, {
        stripe_account_id: stripeUserId,
        stripe_access_token: accessToken,
        stripe_refresh_token: refreshToken,
        stripe_account_enabled: true,
      });
      // Redirect to creator onboarding
      return NextResponse.redirect(`${getURL()}/creator/onboarding?stripe_success=true`);
    }
  } catch (error) {
    console.error('Stripe OAuth callback error:', error);
    // Redirect to a generic error page or the last known onboarding step
    return NextResponse.redirect(`${getURL()}/creator/onboarding?stripe_error=true`);
  }
}