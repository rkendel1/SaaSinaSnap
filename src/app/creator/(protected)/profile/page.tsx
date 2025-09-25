import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Settings, UserCog } from 'lucide-react'; // Added UserCog import

import { Button } from '@/components/ui/button';
import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { CustomDomainGuide } from '@/features/creator/components/CustomDomainGuide'; // Import CustomDomainGuide
import { ProfileForm } from '@/features/creator/components/ProfileForm';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';

export default async function CreatorProfilePage() {
  const authenticatedUser = await getAuthenticatedUser(); // Use getAuthenticatedUser

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  const profile = await getCreatorProfile(authenticatedUser.id); // Use authenticatedUser.id

  if (!profile) {
    redirect('/login');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="h-8 w-8" />
            Creator Profile
          </h1>
          <Button variant="outline" asChild>
            <Link href="/creator/dashboard" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <ProfileForm initialProfile={profile} />
        
        <div className="mt-12">
          <CustomDomainGuide creatorProfile={profile} />
        </div>

        <div className="mt-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Looking for Account Settings?</h2>
          <p className="text-gray-600 mb-6">
            Manage your personal details, email, and platform subscription in your general account settings.
          </p>
          <Button asChild>
            <Link href="/account" className="flex items-center gap-2 mx-auto w-fit">
              <UserCog className="h-4 w-4" />
              Go to Account Settings
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}