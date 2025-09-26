import { notFound } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { CreatorAccountPage } from '@/features/creator/components/creator-account-page';
import { getCreatorBySlug } from '@/features/creator/controllers/get-creator-by-slug';
import { getWhiteLabeledPage } from '@/features/creator/controllers/get-white-labeled-page';

interface CreatorAccountPageProps {
  params: Promise<{ creatorSlug: string }>;
  searchParams: Promise<{ preview?: string }>;
}

export default async function CreatorAccount({ params, searchParams }: CreatorAccountPageProps) {
  const { creatorSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const isPreview = resolvedSearchParams.preview === 'true';
  
  // Get creator profile
  const creator = await getCreatorBySlug(creatorSlug, isPreview);
  if (!creator) {
    notFound();
  }

  // Get white-labeled page config
  const pageConfig = await getWhiteLabeledPage(creator.id, 'account');

  return (
    <CreatorAccountPage 
      creator={creator}
      pageConfig={pageConfig}
    />
  );
}

export async function generateMetadata({ params, searchParams }: CreatorAccountPageProps) {
  const { creatorSlug } = await params;
  const resolvedSearchParams = await searchParams;
  const isPreview = resolvedSearchParams.preview === 'true';
  const creator = await getCreatorBySlug(creatorSlug, isPreview);
  
  if (!creator) {
    return {
      title: 'Account Not Found',
    };
  }

  return {
    title: `Account - ${creator.business_name}`,
    description: `Manage your account for ${creator.business_name}`,
  };
}