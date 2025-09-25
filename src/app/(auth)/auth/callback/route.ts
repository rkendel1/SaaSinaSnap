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

    // 1. Check if the user has a creator profile and if onboarding is completed.
    const creatorProfile = await getCreatorProfile(user.id);

    if (creatorProfile) { // User has a creator profile
      if (!creatorProfile.onboarding_completed) {
        // Creator has a profile but not completed onboarding
        return NextResponse.redirect(`${siteUrl}/creator/onboarding`);
      } else {
        // Creator has a profile and completed onboarding
        return NextResponse.redirect(`${siteUrl}/creator/dashboard`);
      }
    }

    // 2. If the user is NOT a creator (no creatorProfile), then check for platform subscription.
    const { data: userSubscription } = await supabase
      .from('subscriptions')
      .select('status')
      .in('status', ['trialing', 'active'])
      .maybeSingle();

    if (!userSubscription) {
      // Not a creator, and no active platform subscription, send to pricing page.
      return NextResponse.redirect(`${siteUrl}/pricing`);
    } else {
      // Not a creator, but has an active platform subscription.
      // Redirect to the main site URL for now, or a generic user dashboard if one existed.
      return NextResponse.redirect(siteUrl);
    }
  }

  return NextResponse.redirect(siteUrl);
}