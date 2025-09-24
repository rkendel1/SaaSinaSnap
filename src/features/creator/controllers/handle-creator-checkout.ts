import Stripe from 'stripe';

import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';

export async function handleCreatorCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const creatorId = session.metadata?.creator_id;
    const productId = session.metadata?.product_id;
    const userId = session.metadata?.user_id;

    if (!creatorId || !productId || !userId) {
      console.warn('Missing metadata in checkout session for creator analytics');
      return;
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
        },
        period_start: new Date().toISOString(),
        period_end: new Date().toISOString(),
      },
    ]);

    // Update product stats
    const { error: rpcError } = await supabaseAdminClient.rpc('increment_product_sales', {
      product_id: productId,
      amount: totalAmount,
    });

    if (rpcError) {
      console.warn('RPC function increment_product_sales not found, skipping product stats update');
    }

    console.log(`Creator analytics recorded for checkout: ${session.id}`);
  } catch (error) {
    console.error('Error handling creator checkout completed:', error);
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