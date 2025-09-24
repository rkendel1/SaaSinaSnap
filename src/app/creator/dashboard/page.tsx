import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';

export default async function CreatorDashboardPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const creatorProfile = await getCreatorProfile(session.user.id);

  if (!creatorProfile || !creatorProfile.onboarding_completed) {
    redirect('/creator/onboarding');
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Creator Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {creatorProfile.business_name || 'Creator'}! Manage your SaaS platform from here.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Sales</span>
                <span className="font-medium">$0.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Active Customers</span>
                <span className="font-medium">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Products</span>
                <span className="font-medium">0</span>
              </div>
            </div>
          </div>

          {/* Storefront Link */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold mb-4">Your Storefront</h3>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Share your storefront with customers:
              </p>
              <div className="p-3 bg-muted rounded-md">
                <code className="text-xs break-all">
                  {creatorProfile.custom_domain 
                    ? `https://${creatorProfile.custom_domain}` 
                    : `https://staryer.com/creator/${creatorProfile.id}/store`
                  }
                </code>
              </div>
              <div className="flex gap-2">
                <button className="text-xs text-primary hover:underline">Copy Link</button>
                <button className="text-xs text-primary hover:underline">Open Store</button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <button className="w-full text-left p-2 text-sm hover:bg-muted rounded">
                Add New Product
              </button>
              <button className="w-full text-left p-2 text-sm hover:bg-muted rounded">
                Customize Storefront
              </button>
              <button className="w-full text-left p-2 text-sm hover:bg-muted rounded">
                View Analytics
              </button>
              <button className="w-full text-left p-2 text-sm hover:bg-muted rounded">
                Manage Webhooks
              </button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold mb-4">Recent Activity</h3>
            <div className="text-center py-8 text-muted-foreground">
              <p>No recent activity to show.</p>
              <p className="text-sm mt-2">Start promoting your SaaS to see activity here!</p>
            </div>
          </div>
        </div>

        {/* Getting Started Tips */}
        <div className="mt-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 mb-4">🚀 Getting Started Tips</h3>
            <ul className="space-y-2 text-sm text-blue-700">
              <li>• Test your payment flow by making a small test purchase</li>
              <li>• Share your storefront link on social media</li>
              <li>• Set up email notifications for new sales</li>
              <li>• Create compelling product descriptions</li>
              <li>• Join our creator community for tips and support</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}