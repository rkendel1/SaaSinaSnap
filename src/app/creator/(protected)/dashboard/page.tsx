import Link from 'next/link';
import { redirect } from 'next/navigation';
import { 
  DollarSign, 
  Package, 
  Users, 
  Zap
} from 'lucide-react';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { CopyLinkButton } from '@/features/creator/components/copy-link-button';
import { getCreatorDashboardStats } from '@/features/creator/controllers/get-creator-analytics';
import { PostOnboardingTaskDashboard } from '@/features/creator-onboarding/components/PostOnboardingTaskDashboard';
import { getCreatorProducts } from '@/features/creator-onboarding/controllers/creator-products';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { getURL } from '@/utils/get-url';

import { DashboardQuickActions } from './components/DashboardQuickActions';

export default async function CreatorDashboardPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  const [creatorProfile, creatorProducts, dashboardStats] = await Promise.all([
    getCreatorProfile(authenticatedUser.id),
    getCreatorProducts(authenticatedUser.id),
    getCreatorDashboardStats(authenticatedUser.id),
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

      {/* Enhanced Quick Metrics */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">${dashboardStats.total_revenue.toFixed(2)}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <div className="mt-2">
            <Button asChild variant="link" size="sm" className="text-xs p-0 h-auto text-green-600">
              <Link href="/creator/dashboard/revenue">View Details →</Link>
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Sales</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.total_sales}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </div>
          <div className="mt-2">
            <Button asChild variant="link" size="sm" className="text-xs p-0 h-auto text-blue-600">
              <Link href="/creator/dashboard/analytics">View Analytics →</Link>
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Products</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats.active_products}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <div className="mt-2">
            <Button asChild variant="link" size="sm" className="text-xs p-0 h-auto text-purple-600">
              <Link href="/creator/products-and-tiers">Manage Products →</Link>
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Growth</p>
              <p className="text-2xl font-bold text-gray-900 flex items-center">
                +{((dashboardStats.recent_sales_count / Math.max(dashboardStats.total_sales, 1)) * 100).toFixed(0)}%
                <Zap className="h-4 w-4 text-yellow-500 ml-1" />
              </p>
            </div>
            <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Zap className="h-5 w-5 text-yellow-600" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-xs text-gray-500">Recent activity trend</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold mb-4 text-gray-900 flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            Quick Stats
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Revenue</span>
              <span className="font-medium text-gray-900 text-lg">${dashboardStats.total_revenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Sales</span>
              <span className="font-medium text-gray-900">{dashboardStats.total_sales}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Active Products</span>
              <span className="font-medium text-gray-900 flex items-center gap-1">
                {dashboardStats.active_products}
                {dashboardStats.active_products > 0 && (
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                )}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Recent Sales (30d)</span>
              <span className="font-medium text-gray-900">{dashboardStats.recent_sales_count}</span>
            </div>
            {dashboardStats.total_revenue > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <Button asChild variant="link" className="text-sm p-0 h-auto">
                  <Link href="/creator/dashboard/analytics">View detailed analytics →</Link>
                </Button>
              </div>
            )}
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
        {/* Quick Actions Card - Now with collapsible sections */}
        <DashboardQuickActions />

        {/* Products Overview */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Your Products</h3>
            <div className="flex gap-2">
              <Button asChild variant="link" className="text-sm">
                <Link href="/creator/products-and-tiers">View All</Link>
              </Button>
              <Button asChild size="sm" className="text-xs">
                <Link href="/creator/products-and-tiers">Add Product</Link>
              </Button>
            </div>
          </div>
          {creatorProducts.length > 0 ? (
            <div className="space-y-3">
              {creatorProducts.slice(0, 3).map(product => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                  <div>
                    <div className="font-medium text-sm text-gray-900">{product.name}</div>
                    <div className="text-xs text-gray-600 flex items-center gap-2">
                      <span>${product.price}</span>
                      <span>•</span>
                      <span className="capitalize">{product.product_type}</span>
                      {product.status === 'active' ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button asChild variant="ghost" size="sm" className="text-xs">
                      <Link href={`/creator/products-and-tiers?edit=${product.id}`}>
                        Edit
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
              {creatorProducts.length > 3 && (
                <div className="text-center pt-2">
                  <Button asChild variant="link" className="text-sm text-blue-600">
                    <Link href="/creator/products-and-tiers">
                      View {creatorProducts.length - 3} more products
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm">No products yet</p>
              <Button asChild variant="link" className="text-sm mt-2">
                <Link href="/creator/products-and-tiers">Create your first product</Link>
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