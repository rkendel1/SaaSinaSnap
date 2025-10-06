import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { PlatformSubscriptionFlow } from '@/features/platform-subscription/components/PlatformSubscriptionFlow';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';

export default async function SubscribePage() {
  const supabase = createServerComponentClient({ cookies });
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect('/login?redirect=/subscribe');
  }

  // Check if user already has an active subscription
  const { data: subscription } = await supabase
    .from('creator_platform_subscriptions')
    .select('*')
    .eq('creator_id', user.id)
    .eq('status', 'active')
    .single();

  if (subscription) {
    redirect('/creator/onboarding');
  }

  // Get platform pricing tiers
  const { data: pricingTiers } = await supabase
    .from('platform_pricing_tiers')
    .select('*')
    .eq('active', true)
    .order('sort_order', { ascending: true });

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Choose Your Plan
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Get started with a plan that best fits your needs. All plans include our core features.
          </p>
        </div>

        <PlatformSubscriptionFlow 
          pricingTiers={pricingTiers || []} 
          userId={user.id}
        />
      </div>
    </div>
  );
}