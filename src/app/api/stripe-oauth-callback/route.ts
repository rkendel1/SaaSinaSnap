import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/features/account/controllers/get-session';
import { exchangeStripeOAuthCodeForTokens } from '@/features/creator-onboarding/controllers/stripe-connect';
import { updateCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { getURL } from '@/utils/get-url';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const state = requestUrl.searchParams.get('state'); // This is our creatorId

  if (!code || !state) {
    console.error('Stripe OAuth callback: Missing code or state parameter');
    return NextResponse.redirect(`${getURL()}/creator/onboarding?stripe_error=true`);
  }

  try {
    const { accessToken, refreshToken, stripeUserId } = await exchangeStripeOAuthCodeForTokens(code);

    // Update the creator's profile with the new Stripe account ID and tokens
    await updateCreatorProfile(state, {
      stripe_account_id: stripeUserId,
      stripe_access_token: accessToken,
      stripe_refresh_token: refreshToken,
      stripe_account_enabled: true, // Assume enabled after successful OAuth
    });

    // Redirect back to the onboarding flow with a success message
    return NextResponse.redirect(`${getURL()}/creator/onboarding?stripe_success=true`);
  } catch (error) {
    console.error('Stripe OAuth callback: Error exchanging code for tokens or updating profile:', error);
    return NextResponse.redirect(`${getURL()}/creator/onboarding?stripe_error=true`);
  }
}