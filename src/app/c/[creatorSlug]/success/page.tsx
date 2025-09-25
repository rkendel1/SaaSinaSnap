import Link from 'next/link';
import { notFound } from 'next/navigation';

import { CreatorSuccessPage } from '@/features/creator/components/creator-success-page';
import { getCreatorBySlug } from '@/features/creator/controllers/get-creator-by-slug';
import { getSubscriberProductDetails } from '@/features/creator/controllers/get-subscriber-product-details'; // Import new function
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
            href={`/c/${creator.page_slug}`} // Use creator.page_slug
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Return to {creator.business_name}
          </Link>
        </div>
      </div>
    );
  }

  // Ensure creator has a Stripe account connected and access token
  if (!creator.stripe_access_token) {
    throw new Error('Creator Stripe account not connected or access token missing.');
  }

  // Get session details from Stripe using the creator's access token
  let session;
  try {
    session = await stripeAdmin.checkout.sessions.retrieve(session_id, {
      expand: ['subscription', 'line_items'],
    }, {
      stripeAccount: creator.stripe_access_token, // IMPORTANT: Use the creator's access token here
    });
  } catch (error) {
    console.error('Error retrieving checkout session:', error);
    notFound();
  }

  // Fetch the subscribed product details using the session_id (which is also the subscription_id)
  const subscribedProduct = await getSubscriberProductDetails(session_id);

  return (
    <CreatorSuccessPage 
      creator={creator}
      session={session}
      subscribedProduct={subscribedProduct} // Pass the subscribed product
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