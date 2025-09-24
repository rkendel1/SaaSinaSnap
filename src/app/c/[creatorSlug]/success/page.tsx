import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CreatorSuccessPage } from '@/features/creator/components/creator-success-page';
import { getCreatorBySlug } from '@/features/creator/controllers/get-creator-by-slug';
import { stripeAdmin } from '@/libs/stripe/stripe-admin';

interface CreatorSuccessPageProps {
  params: Promise<{ creatorSlug: string }>;
  searchParams: Promise<{ session_id?: string }>;
}

export default async function CreatorSuccess({ params, searchParams }: CreatorSuccessPageProps) {
  const { creatorSlug } = await params;
  const { session_id } = await searchParams;
  
  // Get creator profile
  const creator = await getCreatorBySlug(creatorSlug);
  if (!creator) {
    notFound();
  }

  // If no session_id, show generic success
  if (!session_id) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
          <p className="text-gray-600 mb-8">Your payment has been processed successfully.</p>
          <Link 
            href={`/c/${creator.custom_domain}`}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Return to {creator.business_name}
          </Link>
        </div>
      </div>
    );
  }

  // Get session details from Stripe
  let session;
  try {
    session = await stripeAdmin.checkout.sessions.retrieve(session_id, {
      expand: ['subscription', 'line_items'],
    });
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    notFound();
  }

  return (
    <CreatorSuccessPage 
      creator={creator}
      session={session}
    />
  );
}

export async function generateMetadata({ params }: CreatorSuccessPageProps) {
  const { creatorSlug } = await params;
  const creator = await getCreatorBySlug(creatorSlug);
  
  if (!creator) {
    return {
      title: 'Success',
    };
  }

  return {
    title: `Success - ${creator.business_name}`,
    description: 'Your purchase was completed successfully',
  };
}