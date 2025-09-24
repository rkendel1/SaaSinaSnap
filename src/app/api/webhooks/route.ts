import Stripe from 'stripe';

import { upsertUserSubscription } from '@/features/account/controllers/upsert-user-subscription';
import { handleCreatorCheckoutCompleted } from '@/features/creator/controllers/handle-creator-checkout';
import { upsertPrice } from '@/features/pricing/controllers/upsert-price';
import { upsertProduct } from '@/features/pricing/controllers/upsert-product';
import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { getEnvVar } from '@/utils/get-env-var';

const relevantEvents = new Set([
  'product.created',
  'product.updated',
  'price.created',
  'price.updated',
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  // Stripe Connect events
  'account.updated',
  'account.application.deauthorized',
  'application_fee.created',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
]);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') as string;
  const webhookSecret = getEnvVar(process.env.STRIPE_WEBHOOK_SECRET, 'STRIPE_WEBHOOK_SECRET');
  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) return;
    event = stripeAdmin.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (error) {
    return Response.json(`Webhook Error: ${(error as any).message}`, { status: 400 });
  }

  if (relevantEvents.has(event.type)) {
    try {
      switch (event.type) {
        case 'product.created':
        case 'product.updated':
          await upsertProduct(event.data.object as Stripe.Product);
          break;
        case 'price.created':
        case 'price.updated':
          await upsertPrice(event.data.object as Stripe.Price);
          break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object as Stripe.Subscription;
          await upsertUserSubscription({
            subscriptionId: subscription.id,
            customerId: subscription.customer as string,
            isCreateAction: false,
          });
          break;
        case 'checkout.session.completed':
          const checkoutSession = event.data.object as Stripe.Checkout.Session;

          if (checkoutSession.mode === 'subscription') {
            const subscriptionId = checkoutSession.subscription;
            await upsertUserSubscription({
              subscriptionId: subscriptionId as string,
              customerId: checkoutSession.customer as string,
              isCreateAction: true,
            });
          }

          // Handle creator-specific analytics and notifications
          if (checkoutSession.metadata?.creator_id) {
            await handleCreatorCheckoutCompleted(checkoutSession);
          }
          break;
        case 'account.updated':
          const account = event.data.object as Stripe.Account;
          // Update creator profile when Stripe account is updated
          await supabaseAdminClient
            .from('creator_profiles')
            .update({
              stripe_account_enabled: account.charges_enabled && account.details_submitted,
            })
            .eq('stripe_account_id', account.id);
          break;
        case 'account.application.deauthorized':
          const deauthorizedAccount = event.data.object as Stripe.Account;
          // Handle account deauthorization
          await supabaseAdminClient
            .from('creator_profiles')
            .update({
              stripe_account_enabled: false,
            })
            .eq('stripe_account_id', deauthorizedAccount.id);
          break;
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object as Stripe.PaymentIntent;
          // Track successful payments for analytics
          if (paymentIntent.transfer_data?.destination) {
            const { data: creatorProfile } = await supabaseAdminClient
              .from('creator_profiles')
              .select('id')
              .eq('stripe_account_id', paymentIntent.transfer_data.destination)
              .single();

            if (creatorProfile) {
              await supabaseAdminClient.from('creator_analytics').insert({
                creator_id: creatorProfile.id,
                metric_name: 'payment_succeeded',
                metric_value: paymentIntent.amount / 100,
                metric_data: {
                  currency: paymentIntent.currency,
                  payment_intent_id: paymentIntent.id,
                },
                period_start: new Date().toISOString(),
                period_end: new Date().toISOString(),
              });
            }
          }
          break;
        case 'application_fee.created':
          const applicationFee = event.data.object as Stripe.ApplicationFee;
          // Track platform fees
          const { data: platformCreatorProfile } = await supabaseAdminClient
            .from('creator_profiles')
            .select('id')
            .eq('stripe_account_id', applicationFee.account)
            .single();

          if (platformCreatorProfile) {
            await supabaseAdminClient.from('creator_analytics').insert({
              creator_id: platformCreatorProfile.id,
              metric_name: 'platform_fee',
              metric_value: applicationFee.amount / 100,
              metric_data: {
                currency: applicationFee.currency,
                application_fee_id: applicationFee.id,
              },
              period_start: new Date().toISOString(),
              period_end: new Date().toISOString(),
            });
          }
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error(error);
      return Response.json('Webhook handler failed. View your nextjs function logs.', {
        status: 400,
      });
    }
  }
  return Response.json({ received: true });
}
