import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Settings, Shield, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';

export default async function CreatorAccountSettingsPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  // Verify this is a creator
  const creatorProfile = await getCreatorProfile(authenticatedUser.id);
  if (!creatorProfile) {
    redirect('/account');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button asChild variant="ghost" size="sm">
              <Link href="/creator/account">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Account
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account preferences and security settings.</p>
        </div>

        <div className="grid gap-6">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Profile Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Creator Profile</h4>
                  <p className="text-sm text-gray-600">Update your business information, branding, and public profile</p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/creator/profile">
                    Edit Profile
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                Security & Privacy
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Password & Authentication</h4>
                  <p className="text-sm text-gray-600">Manage your password and two-factor authentication</p>
                </div>
                <Button variant="outline" disabled>
                  Coming Soon
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">API Keys & Webhooks</h4>
                  <p className="text-sm text-gray-600">Manage your API access and webhook endpoints</p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/creator/dashboard/integrations">
                    Manage APIs
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Billing Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-purple-600" />
                Billing & Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Subscription Management</h4>
                  <p className="text-sm text-gray-600">Upgrade, downgrade, or cancel your SaaSinaSnap subscription</p>
                </div>
                <Button asChild>
                  <Link href="/creator/account/manage-subscription">
                    Manage Subscription
                  </Link>
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Invoice History</h4>
                  <p className="text-sm text-gray-600">View and download your billing history and invoices</p>
                </div>
                <Button asChild variant="outline">
                  <Link href="/creator/account/invoices">
                    View Invoices
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}