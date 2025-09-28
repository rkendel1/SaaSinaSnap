import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft, Download, FileText } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';

export default async function CreatorInvoicesPage() {
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
          <h1 className="text-3xl font-bold text-gray-900">Invoice History</h1>
          <p className="text-gray-600 mt-1">View and download your SaaSinaSnap billing history.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Billing History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Access Full Invoice History</h3>
              <p className="text-gray-600 mb-6">
                View and download all your invoices, payment receipts, and billing statements through the Stripe billing portal.
              </p>
              <Button asChild>
                <Link href="/creator/account/manage-subscription">
                  <Download className="h-4 w-4 mr-2" />
                  Access Billing Portal
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Need a specific invoice?</h4>
              <p className="text-blue-700 text-sm mt-1">
                The billing portal provides access to all your historical invoices, receipts, and tax documents. 
                You can also update your billing information and payment methods.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}