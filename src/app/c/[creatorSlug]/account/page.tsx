import { PropsWithChildren, ReactNode } from 'react';
import Link from 'next/link';
import { notFound,redirect } from 'next/navigation'; // Import notFound

import { Button } from '@/components/ui/button';
import { getSession } from '@/features/account/controllers/get-session';
import { getSubscription } from '@/features/account/controllers/get-subscription';
import { CreatorAccountPage } from '@/features/creator/components/creator-account-page';
import { getCreatorBySlug } from '@/features/creator/controllers/get-creator-by-slug';
import { PricingCard } from '@/features/pricing/components/price-card';
import { getProducts } from '@/features/pricing/controllers/get-products';
import { Price, ProductWithPrices, SubscriptionWithProduct } from '@/features/pricing/types';

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
      creator={creator} // creator is guaranteed not null here
      session={session}
      subscription={subscription as SubscriptionWithProduct | null}
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