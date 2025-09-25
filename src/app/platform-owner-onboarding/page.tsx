import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';
import { initializePlatformOwnerOnboardingAction } from '@/features/platform-owner-onboarding/actions/platform-actions';
import { PlatformOwnerOnboardingFlow } from '@/features/platform-owner-onboarding/components/PlatformOwnerOnboardingFlow';
import { getPlatformSettings } from '@/features/platform-owner-onboarding/controllers/get-platform-settings';

import { redirectToPlatformDashboard } from './actions'; // Import the new server action

export const metadata: Metadata = {
  title: 'Platform Owner Onboarding - PayLift',
  description: 'Guided setup for PayLift platform owners.',
};

export default async function PlatformOwnerOnboardingPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  // Guard: Check if a platform owner already exists.
  const existingSettings = await getPlatformSettings();
  if (existingSettings && existingSettings.owner_id !== session.user.id) {
    // An owner exists, and it's not this user. Redirect them to the creator dashboard.
    redirect('/creator/dashboard');
  }

  const platformSettings = await initializePlatformOwnerOnboardingAction();

  // If onboarding is marked as completed AND the Stripe account is enabled, redirect to dashboard.
  // This prevents skipping the flow if Stripe was disconnected or the flow was interrupted.
  if (platformSettings.platform_owner_onboarding_completed && platformSettings.stripe_account_enabled) {
    redirect('/creator/dashboard'); // Or a dedicated admin dashboard
  }

  return (
    <PlatformOwnerOnboardingFlow
      settings={platformSettings}
      onClose={redirectToPlatformDashboard} // Pass the server action directly
    />
  );
}