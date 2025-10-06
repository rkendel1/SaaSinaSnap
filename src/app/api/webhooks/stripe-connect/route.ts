/**
 * Stripe Connect Webhook Handler
 * Handles webhooks from connected accounts (creators)
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

import { StripeSyncService } from '@/features/integrations/services/stripe-sync-service';
import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';
import { getEnvVar } from '@/utils/get-env-var';
import { getURL } from '@/utils/get-url';

const relevantEvents = new Set([
  'product.created',
  'product.updated',
  'product.deleted',
  'price.created',
  'price.updated',
  'price.deleted',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'checkout.session.completed',
]);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') as string;
  const webhookSecret = getEnvVar(
    process.env.STRIPE_CONNECT_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET,
    'STRIPE_CONNECT_WEBHOOK_SECRET'
  );

  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) {
      return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 });
    }
    event = stripeAdmin.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (error) {
    console.error('Webhook signature verification failed:', error);
    return NextResponse.json(
      { error: `Webhook Error: ${(error as any).message}` },
      { status: 400 }
    );
  }

  // Get the connected account ID from the event
  const connectedAccountId = event.account;

  if (!connectedAccountId) {
    console.warn('Received webhook without connected account ID');
    return NextResponse.json({ received: true });
  }

  if (relevantEvents.has(event.type)) {
    try {
      const supabase = await createSupabaseAdminClient();

      switch (event.type) {
        case 'product.created':
        case 'product.updated':
          const product = event.data.object as Stripe.Product;
          await StripeSyncService.syncProductFromStripe(product, connectedAccountId);
          console.log(`Synced product ${product.id} from connected account ${connectedAccountId}`);
          break;

        case 'product.deleted':
          const deletedProduct = event.data.object as Stripe.Product;
          // Mark product as deleted in platform
          await supabase
            .from('creator_products')
            .update({
              active: false,
              metadata: {
                deleted_at: new Date().toISOString(),
                deleted_in_stripe: true
              }
            })
            .eq('stripe_product_id', deletedProduct.id);
          console.log(`Marked product ${deletedProduct.id} as deleted`);
          break;

        case 'price.created':
        case 'price.updated':
          const price = event.data.object as Stripe.Price;
          await StripeSyncService.syncPriceFromStripe(price, connectedAccountId);
          console.log(`Synced price ${price.id} from connected account ${connectedAccountId}`);
          break;

        case 'price.deleted':
          const deletedPrice = event.data.object as Stripe.Price;
          // Archive the price
          await supabase
            .from('creator_products')
            .update({
              metadata: {
                price_deleted_at: new Date().toISOString(),
                deleted_price_id: deletedPrice.id
              }
            })
            .eq('stripe_price_id', deletedPrice.id);
          console.log(`Archived price ${deletedPrice.id}`);
          break;

        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object as Stripe.Subscription;
          
          // Find creator by connected account
          const { data: creator } = await supabase
            .from('creator_profiles')
            .select('id')
            .eq('stripe_account_id', connectedAccountId)
            .single();

          if (creator) {
            // Update subscription in platform
            await supabase
              .from('subscriptions')
              .upsert({
                id: subscription.id,
                user_id: subscription.metadata?.user_id || subscription.customer as string,
                status: subscription.status,
                price_id: subscription.items.data[0]?.price.id,
                quantity: subscription.items.data[0]?.quantity || 1,
                cancel_at_period_end: subscription.cancel_at_period_end,
                created: new Date(subscription.created * 1000).toISOString(),
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
                cancel_at: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null,
                canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
                trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
                trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
                metadata: subscription.metadata
              });

            console.log(`Updated subscription ${subscription.id} for creator ${creator.id}`);
          }
          break;

        case 'invoice.payment_succeeded':
          const successInvoice = event.data.object as Stripe.Invoice;
          
          // Record successful payment
          const { data: successCreator } = await supabase
            .from('creator_profiles')
            .select('id')
            .eq('stripe_account_id', connectedAccountId)
            .single();

          if (successCreator) {
            await supabase
              .from('creator_analytics')
              .insert({
                creator_id: successCreator.id,
                metric_name: 'payment_succeeded',
                metric_value: (successInvoice.amount_paid || 0) / 100,
                metric_data: {
                  invoice_id: successInvoice.id,
                  customer_id: successInvoice.customer,
                  currency: successInvoice.currency
                },
                period_start: new Date().toISOString(),
                period_end: new Date().toISOString()
              });

            console.log(`Recorded payment for creator ${successCreator.id}`);
          }
          break;

        case 'invoice.payment_failed':
          const failedInvoice = event.data.object as Stripe.Invoice;
          
          // Handle failed payment
          const { data: failedCreator } = await supabase
            .from('creator_profiles')
            .select('id')
            .eq('stripe_account_id', connectedAccountId)
            .single();

          if (failedCreator) {
            // Could trigger notification to creator about failed payment
            console.log(`Payment failed for creator ${failedCreator.id}, invoice ${failedInvoice.id}`);
          }
          break;

        case 'checkout.session.completed':
          const session = event.data.object as Stripe.Checkout.Session;
          
          // Handle successful checkout
          const { data: checkoutCreator } = await supabase
            .from('creator_profiles')
            .select('id')
            .eq('stripe_account_id', connectedAccountId)
            .single();

          if (checkoutCreator && session.subscription) {
            // Link subscription to user
            await supabase
              .from('subscriptions')
              .update({
                user_id: session.metadata?.user_id || session.customer as string
              })
              .eq('id', session.subscription as string);

            console.log(`Linked subscription ${session.subscription} to user`);
          }
          break;

        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Webhook handler error:', error);
      return NextResponse.json(
        { error: 'Webhook handler failed' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}