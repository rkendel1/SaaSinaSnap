import Stripe from 'stripe';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

import { sendCreatorBrandedEmail } from './email-service';

export async function handleCreatorCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const creatorId = session.metadata?.creator_id;
    const productId = session.metadata?.product_id;
    const userId = session.metadata?.user_id;

    if (!creatorId || !productId || !userId) {
      console.warn('Missing metadata in checkout session for creator analytics');
      return;
    }

    // Get customer details for email
    let customerName = session.customer_details?.name || 'Valued Customer';
    let customerEmail = session.customer_details?.email;

    // If no customer email from session, try to get from user record
    if (!customerEmail && userId) {
      const { data: user } = await supabaseAdminClient
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (user) {
        customerEmail = (user as any).email || customerEmail;
        customerName = (user as any).full_name || customerName;
      }
    }

    // Get product details
    const { data: product } = await supabaseAdminClient
      .from('creator_products')
      .select('name')
      .eq('id', productId)
      .single();

    // Send welcome email if we have the customer's email
    if (customerEmail && creatorId) {
      await sendCreatorBrandedEmail({
        type: 'welcome',
        creatorId,
        customerEmail,
        customerName,
        data: {
          productName: product?.name || 'Premium Plan',
        },
      });
    }

    // Record analytics for the creator
    const totalAmount = session.amount_total ? session.amount_total / 100 : 0;
    
    await supabaseAdminClient.from('creator_analytics').insert([
      {
        creator_id: creatorId,
        metric_name: 'checkout_completed',
        metric_value: totalAmount,
        metric_data: {
          session_id: session.id,
          product_id: productId,
          user_id: userId,
          payment_status: session.payment_status,
          mode: session.mode,
          currency: session.currency,
          customer_email: customerEmail,
        },
        period_start: new Date().toISOString(),
        period_end: new Date().toISOString(),
      },
    ]);

    // Update product stats
    // The RPC function `increment_product_sales` is designed to update `creator_products` directly
    // and does not require the Stripe access token.
    const { error: rpcError } = await supabaseAdminClient.rpc('increment_product_sales', {
      product_id: productId,
      amount: totalAmount,
    });

    if (rpcError) {
      console.warn('RPC function increment_product_sales not found, skipping product stats update');
    }

    console.log(`Creator analytics and welcome email processed for checkout: ${session.id}`);
  } catch (error) {
    console.error('Error handling creator checkout completed:', error);
  }
}

export async function handleCreatorPaymentFailed(invoice: Stripe.Invoice) {
  try {
    // Get subscription to find creator metadata
    const subscriptionId = invoice.subscription as string;
    const subscription = await supabaseAdminClient
      .from('subscriptions')
      .select('metadata')
      .eq('id', subscriptionId)
      .single();

    if (!subscription.data?.metadata) {
      console.log('No creator metadata found for subscription, skipping creator email');
      return;
    }

    const metadata = subscription.data.metadata as Record<string, any>;
    const creatorId = metadata.creator_id;

    if (!creatorId || !invoice.customer_email) {
      console.log('Missing creator ID or customer email, skipping payment failed email');
      return;
    }

    // Calculate next retry date (Stripe usually retries in 3-7 days)
    const nextRetryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString();

    // Send payment failed email
    await sendCreatorBrandedEmail({
      type: 'payment_failed',
      creatorId,
      customerEmail: invoice.customer_email,
      customerName: invoice.customer_name || 'Valued Customer',
      data: {
        nextRetryDate,
        invoiceId: invoice.id,
        amount: (invoice.amount_due / 100).toFixed(2),
      },
    });

    console.log(`Creator payment failed email sent for invoice: ${invoice.id}`);
  } catch (error) {
    console.error('Error handling creator payment failed:', error);
  }
}

// Add this SQL function to your database migrations if needed:
/*
CREATE OR REPLACE FUNCTION increment_product_sales(product_id uuid, amount decimal)
RETURNS void AS $$
BEGIN
  UPDATE creator_products 
  SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
    'total_sales', COALESCE((metadata->>'total_sales')::decimal, 0) + amount,
    'sales_count', COALESCE((metadata->>'sales_count')::integer, 0) + 1,
    'last_sale_at', now()
  )
  WHERE id = product_id;
END;
$$ LANGUAGE plpgsql;
*/