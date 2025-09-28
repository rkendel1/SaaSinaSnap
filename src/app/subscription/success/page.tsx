import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import SubscriptionSuccessClient from './SubscriptionSuccessClient';

interface SearchParams {
  session_id?: string;
}

export default async function SubscriptionSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { session_id } = searchParams;

  if (!session_id) {
    redirect('/pricing');
  }

  try {
    // Get the checkout session from Stripe
    const session = await stripeAdmin.checkout.sessions.retrieve(session_id);
    
    if (!session) {
      redirect('/pricing');
    }

    // Get the authenticated user
    const user = await getAuthenticatedUser();
    
    if (!user) {
      redirect('/signup');
    }

    // Check if user has been assigned creator role and has creator profile
    const supabase = await createSupabaseServerClient();
    
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();

    const { data: creatorProfile } = await supabase
      .from('creator_profiles')
      .select('id, onboarding_completed')
      .eq('id', user.id)
      .single();

    // Log the subscription success event if it doesn't exist
    const { data: existingEvent } = await supabase
      .from('subscription_success_events')
      .select('id')
      .eq('stripe_session_id', session_id)
      .eq('user_id', user.id)
      .single();

    if (!existingEvent) {
      await (supabase
        .from('subscription_success_events') as any)
        .insert({
          user_id: user.id,
          subscription_id: session.subscription as string,
          stripe_session_id: session_id,
          product_id: session.metadata?.product_id,
          price_id: session.metadata?.price_id,
          role_assigned: (userData as any)?.role || 'creator',
          creator_profile_created: !!creatorProfile,
          onboarding_redirected: false,
          metadata: {
            session_mode: session.mode,
            payment_status: session.payment_status,
            amount_total: session.amount_total,
          },
        });
    }

    return (
      <Suspense fallback={<div>Loading...</div>}>
        <SubscriptionSuccessClient
          session={session}
          userRole={(userData as any)?.role || 'user'}
          hasCreatorProfile={!!creatorProfile}
          onboardingCompleted={(creatorProfile as any)?.onboarding_completed || false}
        />
      </Suspense>
    );
  } catch (error) {
    console.error('Error processing subscription success:', error);
    redirect('/pricing');
  }
}