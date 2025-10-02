import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AlertCircle, CheckCircle2, CreditCard, FileText, Mail, MapPin, Package, Phone, Settings, TrendingUp, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
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
              <Package className="h-5 w-5 text-green-600" />
              SaaSinaSnap Platform Subscription
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {typedSubscription ? (
              <>
                {/* Subscription Status Banner */}
                <div className={`p-4 rounded-lg border ${
                  typedSubscription.status === 'active' 
                    ? 'bg-green-50 border-green-200' 
                    : typedSubscription.status === 'trialing'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-yellow-50 border-yellow-200'
                }`}>
                  <div className="flex items-center gap-3">
                    {typedSubscription.status === 'active' ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    ) : typedSubscription.status === 'trialing' ? (
                      <AlertCircle className="h-6 w-6 text-blue-600" />
                    ) : (
                      <AlertCircle className="h-6 w-6 text-yellow-600" />
                    )}
                    <div>
                      <p className={`font-semibold ${
                        typedSubscription.status === 'active' 
                          ? 'text-green-900' 
                          : typedSubscription.status === 'trialing'
                          ? 'text-blue-900'
                          : 'text-yellow-900'
                      }`}>
                        {typedSubscription.status === 'active' 
                          ? 'Your subscription is active' 
                          : typedSubscription.status === 'trialing'
                          ? 'You are on a trial period'
                          : `Subscription status: ${typedSubscription.status}`}
                      </p>
                      <p className={`text-sm ${
                        typedSubscription.status === 'active' 
                          ? 'text-green-700' 
                          : typedSubscription.status === 'trialing'
                          ? 'text-blue-700'
                          : 'text-yellow-700'
                      }`}>
                        {typedSubscription.status === 'trialing' && typedSubscription.trial_end
                          ? `Trial ends on ${new Date(typedSubscription.trial_end).toLocaleDateString()}`
                          : `Next billing date: ${new Date(typedSubscription.current_period_end).toLocaleDateString()}`
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Plan Details Grid */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Current Plan</p>
                    <p className="text-xl font-bold text-gray-900">
                      {typedSubscription.prices?.products?.name || 'N/A'}
                    </p>
                    {typedSubscription.prices?.products?.description && (
                      <p className="text-sm text-gray-600">
                        {typedSubscription.prices.products.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Billing Amount</p>
                    <p className="text-xl font-bold text-gray-900">
                      ${((typedSubscription.prices?.unit_amount || 0) / 100).toFixed(2)}
                      <span className="text-sm font-normal text-gray-600">
                        /{typedSubscription.prices?.interval || 'month'}
                      </span>
                    </p>
                    {typedSubscription.quantity && typedSubscription.quantity > 1 && (
                      <p className="text-sm text-gray-600">
                        Quantity: {typedSubscription.quantity}
                      </p>
                    )}
                  </div>
                </div>

                {/* Billing Dates */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3">Billing Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Current Period Started</p>
                      <p className="font-medium text-gray-900">
                        {new Date(typedSubscription.current_period_start).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Next Billing Date</p>
                      <p className="font-medium text-gray-900">
                        {new Date(typedSubscription.current_period_end).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  {typedSubscription.cancel_at_period_end && (
                    <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        <p className="text-sm text-yellow-800">
                          Your subscription will be cancelled at the end of the current billing period
                          {typedSubscription.cancel_at && ` on ${new Date(typedSubscription.cancel_at).toLocaleDateString()}`}.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Plan Features/Limits (Mock data - would come from product metadata) */}
                <div className="border-t pt-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Plan Features & Usage
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-700">Monthly Subscribers</span>
                        <span className="text-sm font-medium text-gray-900">45 / 100</span>
                      </div>
                      <Progress value={45} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">55 subscribers available</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-700">Products Created</span>
                        <span className="text-sm font-medium text-gray-900">3 / 10</span>
                      </div>
                      <Progress value={30} className="h-2" />
                      <p className="text-xs text-gray-500 mt-1">7 more products available</p>
                    </div>
                    
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-700">White-Label Pages</span>
                        <span className="text-sm font-medium text-gray-900">8 / Unlimited</span>
                      </div>
                      <Progress value={100} className="h-2" />
                      <p className="text-xs text-green-600 mt-1">✓ Unlimited pages on your plan</p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t">
                  <Button asChild className="flex-1">
                    <Link href="/creator/account/manage-subscription">
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Subscription
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="flex-1">
                    <Link href="/creator/account/invoices">
                      <FileText className="h-4 w-4 mr-2" />
                      View Invoices
                    </Link>
                  </Button>
                </div>

                {/* Upgrade Option */}
                {typedSubscription.prices?.products?.name !== 'Enterprise' && (
                  <div className="mt-4 p-4 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-purple-900 mb-1">Need more capacity?</h4>
                        <p className="text-sm text-purple-700">
                          Upgrade your plan for more subscribers, products, and advanced features.
                        </p>
                      </div>
                      <Button asChild variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-100">
                        <Link href="/pricing">
                          View Plans
                        </Link>
                      </Button>
                    </div>
                  </div>
                )}
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

        {/* Recent Billing History */}
        {typedSubscription && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Recent Billing History
                </div>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/creator/account/invoices">
                    View All
                  </Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Most Recent Payment */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {typedSubscription.prices?.products?.name || 'Subscription'} Payment
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(typedSubscription.current_period_start).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ${((typedSubscription.prices?.unit_amount || 0) / 100).toFixed(2)}
                    </p>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      Paid
                    </Badge>
                  </div>
                </div>

                {/* Previous Payment (Mock) */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-full">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {typedSubscription.prices?.products?.name || 'Subscription'} Payment
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(new Date(typedSubscription.current_period_start).setMonth(
                          new Date(typedSubscription.current_period_start).getMonth() - 1
                        )).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ${((typedSubscription.prices?.unit_amount || 0) / 100).toFixed(2)}
                    </p>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      Paid
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <Button asChild variant="outline" className="w-full">
                  <Link href="/creator/account/manage-subscription">
                    Access Stripe Billing Portal
                  </Link>
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  View complete billing history, download invoices, and manage payment methods
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}