import { redirect } from 'next/navigation';

import { getCustomerId } from '@/features/account/controllers/get-customer-id';
import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Updated import
import { getCreatorBySlug } from '@/features/creator/controllers/get-creator-by-slug';
import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { getURL } from '@/utils/get-url';

export const dynamic = 'force-dynamic';

interface CreatorManageSubscriptionProps {
  params: Promise<{ creatorSlug: string }>;
}

export async function GET(request: Request, { params }: CreatorManageSubscriptionProps) {
  const { creatorSlug } = await params;
  
  // Get creator profile
  const creator = await getCreatorBySlug(creatorSlug);
  if (!creator) {
    redirect(`${getURL()}/404`);
  }

  // 1. Get the user from session
  const user = await getAuthenticatedUser(); // Updated to use getAuthenticatedUser

  if (!user || !user.id) {
    throw Error('Could not get userId');
  }

  // Ensure creator has a Stripe account connected and access token
  if (!creator.stripe_access_token) {
    throw new Error('Creator Stripe account not connected or access token missing.');
  }

  // 2. Retrieve or create the customer in Stripe (using platform's Stripe client)
  const customer = await getCustomerId({
    userId: user.id, // Use user.id directly
  });

  if (!customer) {
    throw Error('Could not get customer');
  }

  // 3. Create portal link with creator branding and redirect user
  const { url } = await stripeAdmin.billingPortal.sessions.create({
    customer,
    return_url: `${getURL()}/c/${creator.custom_domain}/account`,
  }, {
    stripeAccount: creator.stripe_access_token, // IMPORTANT: Use the creator's access token here
  });

  redirect(url);
}