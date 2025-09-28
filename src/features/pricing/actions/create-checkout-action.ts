'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Updated import
import { getOrCreateCustomer } from '@/features/account/controllers/get-or-create-customer';
import { Price } from '@/features/pricing/types';
import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { getURL } from '@/utils/get-url';

// Helper to get tenantId from headers for server actions
function getTenantIdFromHeaders(): string | null {
  return headers().get('x-tenant-id');
}

export async function createCheckoutAction({ price }: { price: Price }) {
  // 1. Get the user from session
  const user = await getAuthenticatedUser(); // Updated to use getAuthenticatedUser

  if (!user) {
    return redirect(`${getURL()}/signup`);
  }

  if (!user.email) {
    throw Error('Could not get email');
  }

  const tenantId = getTenantIdFromHeaders();
  if (!tenantId) throw new Error('Tenant context not found');

  // 2. Retrieve or create the customer in Stripe
  const customer = await getOrCreateCustomer({
    userId: user.id, // Use user.id directly
    email: user.email, // Use user.email directly
  });

  // 3. Create a checkout session in Stripe
  const checkoutSession = await stripeAdmin.checkout.sessions.create({
    payment_method_types: ['card'],
    billing_address_collection: 'required',
    customer,
    customer_update: {
      address: 'auto',
    },
    line_items: [
      {
        price: price.id,
        quantity: 1,
      },
    ],
    mode: price.type === 'recurring' ? 'subscription' : 'payment',
    allow_promotion_codes: true,
    success_url: `${getURL()}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${getURL()}/`,
    metadata: {
      tenant_id: tenantId, // Pass tenantId in metadata
      user_id: user.id,
      price_id: price.id,
    },
  });

  if (!checkoutSession || !checkoutSession.url) {
    throw Error('checkoutSession is not defined');
  }

  // 4. Redirect to checkout url
  redirect(checkoutSession.url);
}