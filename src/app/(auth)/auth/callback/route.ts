import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';
import { getURL } from '@/utils/get-url';

const siteUrl = getURL();

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.exchangeCodeForSession(code);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.redirect(`${siteUrl}/login`);
    }

    // Check for an active subscription first
    const { data: userSubscription } = await supabase
      .from('subscriptions')
      .select('status')
      .in('status', ['trialing', 'active'])
      .maybeSingle();

    if (!userSubscription) {
      // No active subscription, send to pricing page to pay for the service
      return NextResponse.redirect(`${siteUrl}/pricing`);
    }

    // User has a subscription, now check creator onboarding status
    const creatorProfile = await getCreatorProfile(user.id);

    if (!creatorProfile || !creatorProfile.onboarding_completed) {
      // User has paid but not completed onboarding
      return NextResponse.redirect(`${siteUrl}/creator/onboarding`);
    } else {
      // User has paid and completed onboarding
      return NextResponse.redirect(`${siteUrl}/creator/dashboard`);
    }
  }

  return NextResponse.redirect(siteUrl);
}