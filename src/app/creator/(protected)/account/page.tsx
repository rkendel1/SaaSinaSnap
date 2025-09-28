import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CreditCard, FileText, Mail, MapPin, Package, Phone, Settings,User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { getSubscription } from '@/features/account/controllers/get-subscription';
import { getUser } from '@/features/account/controllers/get-user';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { SubscriptionWithProduct } from '@/features/pricing/types';

export default async function CreatorAccountPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  // Verify this is a creator
  const creatorProfile = await getCreatorProfile(authenticatedUser.id);
  if (!creatorProfile) {
    // Redirect non-creators to regular account page
    redirect('/account');
  }

  const [userData, subscription] = await Promise.all([
    getUser(),
    getSubscription(),
  ]);

  const user = userData as any;

  if (!user) {
    redirect('/login');
  }

  const formatAddress = (address: any) => {
    if (!address) return 'N/A';
    const parts = [address.line1, address.line2, address.city, address.state, address.postal_code, address.country].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'N/A';
  };

  const formatPaymentMethod = (paymentMethod: any) => {
    if (!paymentMethod) return 'N/A';
    if (paymentMethod.card) {
      return `Card ending in ${paymentMethod.card.last4} (${paymentMethod.card.brand})`;
    }
    return 'N/A';
  };

  const typedSubscription = subscription as SubscriptionWithProduct | null;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Creator Account Management</h1>
          <p className="text-gray-600 mt-1">Manage your SaaSinaSnap subscription, billing, and account settings.</p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Subscription Management */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-50">
                  <CreditCard className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold">Subscription</h3>
              </div>
              <p className="text-gray-600 mb-4 text-sm">
                Manage your SaaSinaSnap platform subscription and billing.
              </p>
              <Button asChild className="w-full">
                <Link href="/creator/account/manage-subscription">
                  Manage Subscription
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Invoice History */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-green-50">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-semibold">Invoices</h3>
              </div>
              <p className="text-gray-600 mb-4 text-sm">
                View and download your billing history and invoices.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/creator/account/invoices">
                  View Invoices
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Profile Settings */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-purple-50">
                  <User className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold">Profile</h3>
              </div>
              <p className="text-gray-600 mb-4 text-sm">
                Update your creator profile and business information.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/creator/profile">
                  Edit Profile
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-orange-50">
                  <Settings className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold">Settings</h3>
              </div>
              <p className="text-gray-600 mb-4 text-sm">
                Configure account preferences and security settings.
              </p>
              <Button asChild variant="outline" className="w-full">
                <Link href="/creator/account/settings">
                  Account Settings
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                {user.avatar_url ? (
                  <Image 
                    src={user.avatar_url} 
                    alt={user.full_name || 'User Avatar'} 
                    width={48} 
                    height={48} 
                    className="w-12 h-12 rounded-full object-cover" 
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-lg font-medium">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : authenticatedUser.email?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{user.full_name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{authenticatedUser.email}</p>
                </div>
              </div>
              <div className="pt-3">
                <p className="text-sm font-medium text-gray-700 mb-1">Creator Business</p>
                <p className="text-gray-900">{creatorProfile.business_name || 'Not set'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Billing Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-purple-600" />
                Billing Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
                  <Mail className="h-4 w-4" />
                  Billing Email
                </p>
                <p className="text-gray-900">{creatorProfile.billing_email || authenticatedUser.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
                  <Phone className="h-4 w-4" />
                  Billing Phone
                </p>
                <p className="text-gray-900">{creatorProfile.billing_phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4" />
                  Billing Address
                </p>
                <p className="text-gray-900">{formatAddress(creatorProfile.billing_address || user.billing_address)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Details */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              SaaSinaSnap Platform Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {typedSubscription ? (
              <>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Plan</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {typedSubscription.prices?.products?.name || 'N/A'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">Status</p>
                    <p className="text-lg font-semibold text-green-600 capitalize">
                      {typedSubscription.status}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Price</p>
                    <p className="text-gray-900">
                      ${(typedSubscription.prices?.unit_amount || 0) / 100} / {typedSubscription.prices?.interval}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">Next Billing</p>
                    <p className="text-gray-900">
                      {new Date(typedSubscription.current_period_end).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Payment Method</p>
                    <p className="text-gray-900">{formatPaymentMethod(user.payment_method)}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button asChild className="flex-1">
                    <Link href="/creator/account/manage-subscription">
                      Manage Subscription
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/creator/account/invoices">
                      View Invoices
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600 mb-4">You do not have an active SaaSinaSnap subscription.</p>
                <Button asChild>
                  <Link href="/pricing">View Pricing Plans</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}