import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import type { PropsWithChildren } from 'react';

import { createSupabaseAdminClient } from '@/libs/supabase/supabase-admin';

/**
 * Platform Owner Onboarding Layout - Protected by middleware
 * This layout handles the special case of preventing completed platform owners
 * from accessing the onboarding flow again.
 */
export default async function PlatformOwnerOnboardingLayout({ children }: PropsWithChildren) {
  // Verify we're in a middleware-protected route
  headers();

  // Check if platform owner has completed onboarding
  const supabaseAdmin = await createSupabaseAdminClient();
  const { data: settings } = await supabaseAdmin
    .from('platform_settings')
    .select('platform_owner_onboarding_completed')
    .single();

  // If onboarding is completed, redirect to dashboard
  if (settings?.platform_owner_onboarding_completed === true) {
    redirect('/dashboard');
  }

  // Allow access to onboarding for platform owners who haven't completed it
  return <>{children}</>;
}