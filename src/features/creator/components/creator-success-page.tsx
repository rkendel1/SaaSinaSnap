import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import Stripe from 'stripe';

import { Button } from '@/components/ui/button';

import { CreatorProfile } from '../types';

interface CreatorSuccessPageProps {
  creator: CreatorProfile;
  session: Stripe.Checkout.Session;
}

export function CreatorSuccessPage({ creator, session }: CreatorSuccessPageProps) {
  const brandColor = creator.brand_color || '#3b82f6';
  
  const getNextBillingDate = () => {
    if (session.mode === 'subscription' && session.subscription) {
      const subscription = session.subscription as Stripe.Subscription;
      return new Date(subscription.current_period_end * 1000);
    }
    return null;
  };

  const nextBilling = getNextBillingDate();

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-4 py-6 lg:px-6 border-b">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link href={`/c/${creator.custom_domain}`}>
            {creator.business_logo_url ? (
              <Image
                src={creator.business_logo_url}
                alt={creator.business_name || 'Business Logo'}
                width={160}
                height={40}
                className="h-10 w-auto"
              />
            ) : (
              <div className="text-2xl font-bold" style={{ color: brandColor }}>
                {creator.business_name || 'SaaS Platform'}
              </div>
            )}
          </Link>
        </div>
      </header>

      {/* Success Section */}
      <section className="px-4 py-16 lg:px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-8">
            <CheckCircle 
              size={64} 
              className="mx-auto mb-6"
              style={{ color: brandColor }}
            />
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Payment Successful!
            </h1>
            <p className="text-xl text-gray-600">
              Thank you for your purchase. Your order has been confirmed.
            </p>
          </div>

          {/* Order Details */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8 text-left">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Order Details
            </h2>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Order ID:</span>
                <span className="font-mono text-sm text-gray-900">
                  {session.id}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Amount Paid:</span>
                <span className="font-semibold text-gray-900">
                  ${(session.amount_total || 0) / 100}
                </span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="text-gray-900">
                  {session.payment_method_types?.[0] || 'Card'}
                </span>
              </div>

              {session.mode === 'subscription' && nextBilling && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Next Billing Date:</span>
                  <span className="text-gray-900">
                    {nextBilling.toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Next Steps */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              What happens next?
            </h2>
            <div className="text-left space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                  <span className="text-green-600 text-xs font-bold">1</span>
                </div>
                <p className="text-gray-600">
                  You'll receive a confirmation email with your receipt and access details
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                  <span className="text-green-600 text-xs font-bold">2</span>
                </div>
                <p className="text-gray-600">
                  {session.mode === 'subscription' 
                    ? 'Your subscription is now active and ready to use'
                    : 'Your purchase is complete and ready for download/access'
                  }
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                  <span className="text-green-600 text-xs font-bold">3</span>
                </div>
                <p className="text-gray-600">
                  You can manage your account and {session.mode === 'subscription' ? 'subscription' : 'purchases'} anytime
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
            <Button 
              variant="outline"
              asChild
            >
              <Link href={`/c/${creator.custom_domain}`}>
                <span>← Back to {creator.business_name}</span>
              </Link>
            </Button>
            <Button 
              style={{ backgroundColor: brandColor }}
              asChild
            >
              <Link href="/account">
                <span>Manage Account</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}