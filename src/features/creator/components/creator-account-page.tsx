import Image from 'next/image';
import Link from 'next/link';
import { CreditCard, FileText,User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SubscriptionWithProduct } from '@/features/pricing/types';

import { CreatorProfile } from '../types';

interface CreatorAccountPageProps {
  creator: CreatorProfile;
  session: {
    user: {
      id: string;
      email?: string;
      full_name?: string;
    };
  };
  subscription: SubscriptionWithProduct | null;
}

export function CreatorAccountPage({ creator, session, subscription }: CreatorAccountPageProps) {
  const brandColor = creator.brand_color || '#ea580c';
  
  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'trialing':
        return 'text-blue-600 bg-blue-50';
      case 'canceled':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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
                // Removed width and height props to allow CSS classes to control sizing
                className="h-10 w-auto"
              />
            ) : (
              <div className="text-2xl font-bold" style={{ color: brandColor }}>
                {creator.business_name || 'SaaS Platform'}
              </div>
            )}
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link 
              href={`/c/${creator.custom_domain}`}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              <span>Home</span>
            </Link>
            <Link 
              href={`/c/${creator.custom_domain}/pricing`}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              <span>Pricing</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Account Section */}
      <section className="px-4 py-16 lg:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Account Dashboard
            </h1>
            <p className="text-gray-600">
              Manage your account and subscription with {creator.business_name}
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Account Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <User className="w-5 h-5 mr-2" style={{ color: brandColor }} />
                <h2 className="text-lg font-semibold text-gray-900">
                  Account Information
                </h2>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Name</label>
                  <p className="text-gray-900">
                    {session.user.full_name || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">
                    {session.user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Subscription Information */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <CreditCard className="w-5 h-5 mr-2" style={{ color: brandColor }} />
                <h2 className="text-lg font-semibold text-gray-900">
                  Subscription
                </h2>
              </div>
              {subscription ? (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Status</label>
                    <div className="mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(subscription.status)}`}>
                        {subscription.status ? subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1) : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Current Period</label>
                    <p className="text-gray-900">
                      {formatDate(subscription.current_period_start)} - {formatDate(subscription.current_period_end)}
                    </p>
                  </div>
                  {subscription.cancel_at_period_end && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm text-yellow-800">
                        Your subscription will end on {formatDate(subscription.current_period_end)}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-600 mb-4">No active subscription</p>
                  <Button 
                    style={{ backgroundColor: brandColor }}
                    asChild
                  >
                    <Link href={`/c/${creator.custom_domain}/pricing`}>
                      <span>View Plans</span>
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {subscription && (
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button 
                variant="outline"
                className="flex items-center gap-2"
                asChild
              >
                <Link href={`/c/${creator.custom_domain}/manage-subscription`}>
                  <span>
                    <CreditCard className="w-4 h-4" />
                    Manage Subscription
                  </span>
                </Link>
              </Button>
              <Button 
                variant="outline"
                className="flex items-center gap-2"
                asChild
              >
                <Link href={`/c/${creator.custom_domain}/billing`}>
                  <span>
                    <FileText className="w-4 h-4" />
                    View Billing History
                  </span>
                </Link>
              </Button>
            </div>
          )}

          {/* Support Section */}
          <div className="mt-12 bg-gray-50 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Need Help?
            </h2>
            <p className="text-gray-600 mb-4">
              If you have any questions or need assistance with your account, we're here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="outline">
                Contact Support
              </Button>
              <Button variant="outline">
                View Documentation
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white px-4 py-8 lg:px-6">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-gray-600">
            © 2024 {creator.business_name || 'SaaS Platform'}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}