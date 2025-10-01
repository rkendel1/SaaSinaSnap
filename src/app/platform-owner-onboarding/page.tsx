import { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { initializePlatformOwnerOnboardingAction } from '@/features/platform-owner-onboarding/actions/platform-actions';
import { PlatformOwnerOnboardingFlow } from '@/features/platform-owner-onboarding/components/PlatformOwnerOnboardingFlow';
import { getPlatformSettings } from '@/features/platform-owner-onboarding/controllers/get-platform-settings';

import { redirectToPlatformDashboard } from './actions'; // Import the new server action

export const metadata: Metadata = {
  title: 'Platform Owner Onboarding - PayLift',
  description: 'Guided setup for PayLift platform owners.',
};

export default async function PlatformOwnerOnboardingPage() {
  const authenticatedUser = await getAuthenticatedUser(); // Use getAuthenticatedUser

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  // Guard: Check if a platform owner already exists.
  const existingSettings = await getPlatformSettings();
  if (existingSettings && existingSettings.owner_id !== authenticatedUser.id) { // Use authenticatedUser.id
    // An owner exists, and it's not this user. Redirect them to the creator dashboard.
    redirect('/creator/dashboard');
  }

  const platformSettings = await initializePlatformOwnerOnboardingAction();

  // If onboarding is marked as completed, redirect to dashboard.
  if (platformSettings.platform_owner_onboarding_completed) {
    redirect('/creator/dashboard'); // Or a dedicated admin dashboard
  }

  return (
    <PlatformOwnerOnboardingFlow
      settings={platformSettings}
      onClose={redirectToPlatformDashboard} // Pass the server action directly
    />
  );
}