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

    // Check if the user is a creator and if their onboarding is completed
    const creatorProfile = await getCreatorProfile(user.id);

    // If creator profile doesn't exist or onboarding is not completed, redirect to onboarding
    if (!creatorProfile || !creatorProfile.onboarding_completed) {
      return NextResponse.redirect(`${siteUrl}/creator/onboarding`);
    }

    // If onboarding is completed, proceed with existing subscription check
    const { data: userSubscription } = await supabase
      .from('subscriptions')
      .select('*, prices(*, products(*))')
      .in('status', ['trialing', 'active'])
      .maybeSingle();

    if (!userSubscription) {
      return NextResponse.redirect(`${siteUrl}/pricing`);
    } else {
      return NextResponse.redirect(`${siteUrl}/creator/dashboard`);
    }
  }

  return NextResponse.redirect(siteUrl);
}