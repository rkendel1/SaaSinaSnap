import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Eye, FolderOpen, Package, UserCog, Zap } from 'lucide-react';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { CopyLinkButton } from '@/features/creator/components/copy-link-button';
import { getCreatorDashboardStats } from '@/features/creator/controllers/get-creator-analytics';
import { PostOnboardingTaskDashboard } from '@/features/creator-onboarding/components/PostOnboardingTaskDashboard';
import { getCreatorProducts } from '@/features/creator-onboarding/controllers/creator-products';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { getURL } from '@/utils/get-url';

export default async function CreatorDashboardPage() {
  const authenticatedUser = await getAuthenticatedUser(); // Use getAuthenticatedUser

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  const [creatorProfile, creatorProducts, dashboardStats] = await Promise.all([
    getCreatorProfile(authenticatedUser.id), // Use authenticatedUser.id
    getCreatorProducts(authenticatedUser.id), // Use authenticatedUser.id
    getCreatorDashboardStats(authenticatedUser.id), // Use authenticatedUser.id
  ]);

  if (!creatorProfile || !creatorProfile.onboarding_completed) {
    redirect('/creator/onboarding');
  }

  const storefrontUrl = `${getURL()}/c/${creatorProfile.page_slug}`;

  // Check if user recently completed onboarding (within last 7 days)
  const onboardingCompletedAt = new Date(creatorProfile.updated_at);
  const daysSinceOnboarding = Math.floor((Date.now() - onboardingCompletedAt.getTime()) / (1000 * 60 * 60 * 24));
  const showPostOnboardingTasks = daysSinceOnboarding <= 7; // Show for first week

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Logo />
          <h1 className="text-3xl font-bold text-gray-900">
            {creatorProfile.business_name || 'Creator Dashboard'}
          </h1>
        </div>
        <p className="text-gray-600">
          Welcome to your dashboard! Here&apos;s your platform overview.
        </p>
      </div>

      {/* Post-Onboarding Tasks - Show prominently for new users */}
      {showPostOnboardingTasks && (
        <div className="mb-8">
          <PostOnboardingTaskDashboard profile={creatorProfile} />
        </div>
      )}

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

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold mb-4 text-gray-900">Recent Activity</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Products Created</span>
              <span className="font-medium text-gray-900">{creatorProducts.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Page Views (30d)</span>
              <span className="font-medium text-gray-900">--</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Conversion Rate</span>
              <span className="font-medium text-gray-900">--</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Quick Actions Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold mb-4 text-gray-900">Quick Actions</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button asChild variant="outline" className="justify-start">
              <Link href="/design-studio/builder" className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                <span>Create Asset</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/creator/dashboard/products/new" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>Add Product</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/embed-preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>Preview Embeds</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-start">
              <Link href="/creator/profile" className="flex items-center gap-2">
                <UserCog className="h-4 w-4" />
                <span>Edit Profile</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Products Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Your Products</h3>
            <Button asChild variant="link" className="text-sm">
              <Link href="/creator/dashboard/products">View All</Link>
            </Button>
          </div>
          {creatorProducts.length > 0 ? (
            <div className="space-y-3">
              {creatorProducts.slice(0, 3).map(product => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                  <div>
                    <div className="font-medium text-sm text-gray-900">{product.name}</div>
                    <div className="text-xs text-gray-600">${product.price}</div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {product.product_type}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No products yet</p>
              <Button asChild variant="link" className="text-sm mt-2">
                <Link href="/creator/dashboard/products/new">Create your first product</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Setup Tasks - Always accessible but less prominent for older users */}
      {!showPostOnboardingTasks && (
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900">Setup & Optimization</h3>
                <p className="text-sm text-gray-600">Complete additional setup tasks to optimize your platform</p>
              </div>
              <Button asChild variant="outline">
                <Link href="/creator/dashboard/setup-tasks">View All Tasks</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}