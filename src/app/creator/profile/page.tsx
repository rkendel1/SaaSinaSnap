import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getSession } from '@/features/account/controllers/get-session';
import { ProfileForm } from '@/features/creator/components/ProfileForm';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';

export default async function CreatorProfilePage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const profile = await getCreatorProfile(session.user.id);

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
      </div>
    </div>
  );
}