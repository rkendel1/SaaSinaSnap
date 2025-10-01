import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { CreatorFeedbackForm } from '@/features/creator/components/CreatorFeedbackForm';
import { EnhancedCreatorSupport } from '@/features/creator/components/EnhancedCreatorSupport';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';

export default async function CreatorSupportPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  const creatorProfile = await getCreatorProfile(authenticatedUser.id);
  if (!creatorProfile) {
    redirect('/creator/onboarding');
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Creator Support Center</h1>
        <p className="text-gray-600">
          Get help, find resources, and track your progress to build a successful SaaS business.
        </p>
      </div>
      
      <div className="grid gap-6 mb-6">
        <EnhancedCreatorSupport />
        
        {/* Feedback Form */}
        <div className="mt-8">
          <CreatorFeedbackForm 
            creatorId={authenticatedUser.id} 
            creatorName={creatorProfile.business_name || 'Creator'}
          />
        </div>
      </div>
    </div>
  );
}