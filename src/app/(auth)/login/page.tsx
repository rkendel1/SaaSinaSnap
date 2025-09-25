import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';
import { getSubscription } from '@/features/account/controllers/get-subscription';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile'; // Import getCreatorProfile

import { signInWithEmail, signInWithOAuth } from '../auth-actions';
import { AuthUI } from '../auth-ui';

export default async function LoginPage() {
  const session = await getSession();

  if (session) {
    const creatorProfile = await getCreatorProfile(session.user.id);
    if (creatorProfile) {
      if (!creatorProfile.onboarding_completed) {
        redirect('/creator/onboarding');
      } else {
        redirect('/creator/dashboard');
      }
    } else {
      // If no creator profile, check for platform subscription (for regular users)
      const subscription = await getSubscription();
      if (subscription) {
        redirect('/'); // Or a generic user dashboard
      } else {
        redirect('/pricing');
      }
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center py-12 px-4'>
      <AuthUI mode='login' signInWithOAuth={signInWithOAuth} signInWithEmail={signInWithEmail} />
    </div>
  );
}