import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Eye, FolderOpen,Package, UserCog } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getSession } from '@/features/account/controllers/get-session';
import { CopyLinkButton } from '@/features/creator/components/copy-link-button';
import { getCreatorDashboardStats } from '@/features/creator/controllers/get-creator-analytics';
import { getCreatorProducts } from '@/features/creator-onboarding/controllers/creator-products';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { getURL } from '@/utils/get-url';

export default async function CreatorDashboardPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const [creatorProfile, creatorProducts, dashboardStats] = await Promise.all([
    getCreatorProfile(session.user.id),
    getCreatorProducts(session.user.id),
    getCreatorDashboardStats(session.user.id),
  ]);

  if (!creatorProfile || !creatorProfile.onboarding_completed) {
    redirect('/creator/onboarding');
  }

  const storefrontUrl = creatorProfile.custom_domain 
    ? `https://${creatorProfile.custom_domain}` 
    : `${getURL()}/c/${creatorProfile.id}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Creator Dashboard</h1>
          <p className="text-gray-600">
            Welcome back, {creatorProfile.business_name || 'Creator'}! Manage your SaaS platform from here.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold mb-4 text-gray-900">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Revenue</span>
                <span className="font-medium text-gray-900">${dashboardStats.total_revenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Sales</span>
                <span className="font-medium text-gray-900">{dashboardStats.total_sales}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Products</span>
                <span className="font-medium text-gray-900">{dashboardStats.active_products}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Recent Sales (30d)</span>
                <span className="font-medium text-gray-900">{dashboardStats.recent_sales_count}</span>
              </div>
            </div>
          </div>

          {/* Storefront Link */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold mb-4 text-gray-900">Your Storefront</h3>
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4">
                Share your storefront with customers:
              </p>
              <div className="p-3 bg-gray-100 rounded-md border border-gray-200">
                <code className="text-xs break-all text-blue-600">
                  {storefrontUrl}
                </code>
              </div>
              <div className="flex gap-2">
                <CopyLinkButton link={storefrontUrl} label="Copy Link" className="text-xs text-primary hover:underline p-0 h-auto" />
                <Button 
                  variant="link" 
                  className="text-xs text-primary hover:underline p-0 h-auto"
                  asChild
                >
                  <a 
                    href={storefrontUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Open Store
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold mb-4 text-gray-900">Quick Actions</h3>
            <div className="space-y-2">
              <Button asChild variant="ghost" className="w-full justify-start text-gray-700 hover:bg-gray-100">
                <Link href="/creator/dashboard/products" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span>Manage Products</span>
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start text-gray-700 hover:bg-gray-100">
                <Link href="/creator/dashboard">View Analytics</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start text-gray-700 hover:bg-gray-100">
                <Link href="/creator/dashboard/assets" className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  <span>Asset Library</span>
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start text-gray-700 hover:bg-gray-100">
                <Link href="/creator/profile" className="flex items-center gap-2">
                  <UserCog className="h-4 w-4" />
                  <span>Edit Profile & Branding</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Preview Your Embeds</h3>
              <p className="text-sm text-gray-600 mt-1">
                See how your product cards and checkout buttons will look on any website.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/embed-preview">
                <Eye className="h-4 w-4 mr-2" />
                Open Previewer
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}