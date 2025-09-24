import { redirect } from 'next/navigation';
import { Metadata } from 'next';

import { getSession } from '@/features/account/controllers/get-session';
import { initializePlatformOwnerOnboardingAction } from '@/features/platform-owner-onboarding/actions/platform-actions';
import { PlatformOwnerOnboardingFlow } from '@/features/platform-owner-onboarding/components/PlatformOwnerOnboardingFlow';

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

  const platformSettings = await initializePlatformOwnerOnboardingAction();

  // If onboarding is already completed, redirect to a dashboard or home
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