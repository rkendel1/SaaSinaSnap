import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { getCustomerId } from '@/features/account/controllers/get-customer-id';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { getURL } from '@/utils/get-url';

export const dynamic = 'force-dynamic';

export async function GET() {
  // 1. Get the authenticated user
  const user = await getAuthenticatedUser();

  if (!user || !user.id) {
    throw Error('Could not get userId');
  }

  // 2. Verify this is a creator
  const creatorProfile = await getCreatorProfile(user.id);
  if (!creatorProfile) {
    // Redirect non-creators to regular account page
    redirect('/account');
  }

  // 3. Get the customer ID for the platform's Stripe account (not the creator's)
  const customer = await getCustomerId({
    userId: user.id,
  });

  if (!customer) {
    throw Error('Could not get customer');
  }

  // 4. Create portal link for the PLATFORM's Stripe billing portal
  // This uses the default stripeAdmin (platform's Stripe account)
  const { url } = await stripeAdmin.billingPortal.sessions.create({
    customer,
    return_url: `${getURL()}/creator/account`,
  });

  redirect(url);
}