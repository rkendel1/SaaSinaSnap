import { notFound, redirect } from 'next/navigation';

import { getCreatorBySlug } from '@/features/creator/controllers/get-creator-by-slug';
import { getSession } from '@/features/account/controllers/get-session';
import { getSubscription } from '@/features/account/controllers/get-subscription';
import { CreatorAccountPage } from '@/features/creator/components/creator-account-page';

interface CreatorAccountPageProps {
  params: Promise<{ creatorSlug: string }>;
}

export default async function CreatorAccount({ params }: CreatorAccountPageProps) {
  const { creatorSlug } = await params;
  
  // Get creator profile
  const creator = await getCreatorBySlug(creatorSlug);
  if (!creator) {
    notFound();
  }

  // Check if user is logged in
  const [session, subscription] = await Promise.all([
    getSession(),
    getSubscription()
  ]);

  if (!session) {
    redirect(`${process.env.NEXT_PUBLIC_SITE_URL}/login?redirect=/c/${creatorSlug}/account`);
  }

  return (
    <CreatorAccountPage 
      creator={creator}
      session={session}
      subscription={subscription}
    />
  );
}

export async function generateMetadata({ params }: CreatorAccountPageProps) {
  const { creatorSlug } = await params;
  const creator = await getCreatorBySlug(creatorSlug);
  
  if (!creator) {
    return {
      title: 'Account Not Found',
    };
  }

  return {
    title: `Account - ${creator.business_name}`,
    description: `Manage your account with ${creator.business_name}`,
  };
}