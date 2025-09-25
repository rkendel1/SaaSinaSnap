import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CreditCard, Mail, Phone, User, MapPin, Package, Edit } from 'lucide-react'; // Added Edit import

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { getSession } from '@/features/account/controllers/get-session';
import { getSubscription } from '@/features/account/controllers/get-subscription';
import { getUser } from '@/features/account/controllers/get-user';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { SubscriptionWithProduct } from '@/features/pricing/types'; // Import SubscriptionWithProduct
import { getURL } from '@/utils/get-url';

export default async function AccountSettingsPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const [user, subscription, creatorProfile] = await Promise.all([
    getUser(),
    getSubscription(),
    getCreatorProfile(session.user.id),
  ]);

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

  const typedSubscription = subscription as SubscriptionWithProduct | null; // Explicitly type subscription

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-1">Manage your personal information, billing, and subscriptions.</p>
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
                  <img src={user.avatar_url} alt={user.full_name || 'User Avatar'} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 text-lg font-medium">
                    {user.full_name ? user.full_name.charAt(0).toUpperCase() : session.user.email?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">{user.full_name || 'N/A'}</p>
                  <p className="text-sm text-gray-600">{session.user.email}</p>
                </div>
              </div>
              {creatorProfile && (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/creator/profile">
                    <Package className="h-4 w-4 mr-2" />
                    Edit Creator Profile
                  </Link>
                </Button>
              )}
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
                <p className="text-gray-900">{creatorProfile?.billing_email || session.user.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
                  <Phone className="h-4 w-4" />
                  Billing Phone
                </p>
                <p className="text-gray-900">{creatorProfile?.billing_phone || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 flex items-center gap-2 mb-1">
                  <MapPin className="h-4 w-4" />
                  Billing Address
                </p>
                <p className="text-gray-900">{formatAddress(creatorProfile?.billing_address || user.billing_address)}</p>
              </div>
              {creatorProfile && (
                <Button asChild variant="outline" className="w-full">
                  <Link href="/creator/profile">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Billing Details
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Subscription Details */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              Subscription
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
                <Button asChild className="w-full">
                  <Link href={`${getURL()}/c/${creatorProfile?.page_slug || session.user.id}/manage-subscription`}>
                    Manage Subscription in Stripe
                  </Link>
                </Button>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600 mb-4">You do not have an active subscription.</p>
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