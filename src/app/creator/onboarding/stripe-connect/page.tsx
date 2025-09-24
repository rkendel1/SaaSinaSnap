import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Updated import
import { getCreatorProfile, updateCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { getStripeConnectAccount } from '@/features/creator-onboarding/controllers/stripe-connect';

export default async function StripeConnectCallbackPage({
  searchParams,
}: {
  searchParams: { success?: string; refresh?: string };
}) {
  const user = await getAuthenticatedUser(); // Updated to use getAuthenticatedUser

  if (!user?.id) {
    redirect('/login');
  }

  const creatorProfile = await getCreatorProfile(user.id); // Use user.id directly

  if (!creatorProfile) {
    redirect('/creator/onboarding');
  }

  // Handle successful onboarding
  if (searchParams.success === 'true' && creatorProfile.stripe_account_id) {
    try {
      // Check if the Stripe account is now fully set up
      const stripeAccount = await getStripeConnectAccount(creatorProfile.stripe_account_id);
      
      if (stripeAccount.charges_enabled && stripeAccount.details_submitted) {
        // Update the profile to reflect that Stripe is enabled
        await updateCreatorProfile(user.id, { // Use user.id directly
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