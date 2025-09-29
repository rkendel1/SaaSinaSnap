import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { getCreatorProfile, updateCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { getStripeConnectAccount } from '@/features/creator-onboarding/controllers/stripe-connect';

export default async function StripeConnectCallbackPage({
  searchParams,
}: {
  searchParams: { success?: string; refresh?: string };
}) {
  const user = await getAuthenticatedUser();

  if (!user?.id) {
    redirect('/login');
  }

  const creatorProfile = await getCreatorProfile(user.id);

  if (!creatorProfile) {
    redirect('/creator/onboarding');
  }

  // Handle successful onboarding
  const stripeAccessToken = creatorProfile.stripe_test_access_token || creatorProfile.stripe_production_access_token;
  if (searchParams.success === 'true' && stripeAccessToken) { // Check for access token
    try {
      // Check if the Stripe account is now fully set up using the access token
      const stripeAccount = await getStripeConnectAccount(stripeAccessToken);
      
      if (stripeAccount.charges_enabled && stripeAccount.details_submitted) {
        // Update the profile to reflect that Stripe is enabled
        await updateCreatorProfile(user.id, {
          stripe_account_enabled: true,
        });
      }
    } catch (error) {
      console.error('Error checking Stripe account status:', error);
    }
  }

  // Redirect back to onboarding with a success message
  const redirectUrl = `/creator/onboarding${searchParams.success === 'true' ? '?stripe_success=true' : ''}`;
  redirect(redirectUrl);
}