import { redirect } from 'next/navigation';
import Link from 'next/link'; // Import Link

import { Button } from '@/components/ui/button'; // Keep Button for other uses
import { getSession } from '@/features/account/controllers/get-session';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { getCreatorProducts } from '@/features/creator-onboarding/controllers/creator-products'; // Import to fetch creator's products
import { CopyLinkButton } from '@/features/creator/components/copy-link-button'; // Import the new client component
import { getURL } from '@/utils/get-url'; // Import getURL for constructing embed script URL

export default async function CreatorDashboardPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const [creatorProfile, creatorProducts] = await Promise.all([
    getCreatorProfile(session.user.id),
    getCreatorProducts(session.user.id), // Fetch products for the creator
  ]);

  if (!creatorProfile || !creatorProfile.onboarding_completed) {
    redirect('/creator/onboarding');
  }

  const storefrontUrl = creatorProfile.custom_domain 
    ? `https://${creatorProfile.custom_domain}` 
    : `${getURL()}/c/${creatorProfile.id}`;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Creator Dashboard</h1>
          <p className="text-gray-300">
            Welcome back, {creatorProfile.business_name || 'Creator'}! Manage your SaaS platform from here.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold mb-4">Quick Stats</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-300">Total Sales</span>
                <span className="font-medium text-gray-100">$0.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Active Customers</span>
                <span className="font-medium text-gray-100">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Products</span>
                <span className="font-medium text-gray-100">{creatorProducts.length}</span>
              </div>
            </div>
          </div>

          {/* Storefront Link */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold mb-4">Your Storefront</h3>
            <div className="space-y-3">
              <p className="text-sm text-gray-300 mb-4">
                Share your storefront with customers:
              </p>
              <div className="p-3 bg-gray-800 rounded-md">
                <code className="text-xs break-all text-gray-100">
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
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-2">
              <Button asChild variant="ghost" className="w-full justify-start text-gray-100 hover:bg-gray-800">
                <Link href="/creator/onboarding">Add New Product</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start text-gray-100 hover:bg-gray-800">
                <Link href="/creator/onboarding">Customize Storefront</Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start text-gray-100 hover:bg-gray-800">
                <Link href="/creator/dashboard">View Analytics</Link> {/* Links to dashboard for now */}
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start text-gray-100 hover:bg-gray-800">
                <Link href="/creator/onboarding">Manage Webhooks</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Embeddable Products Section */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold mb-4">Embeddable Products</h3>
            <p className="text-gray-300 text-sm mb-4">
              Allow customers to purchase directly from your website by embedding product cards.
            </p>
            {creatorProducts.length > 0 ? (
              <div className="space-y-4">
                {creatorProducts.map((product) => (
                  <div key={product.id} className="border border-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-100 mb-2">{product.name}</h4>
                    <p className="text-sm text-gray-300 mb-3">
                      Copy and paste this code into your website&apos;s HTML where you want the product card to appear.
                    </p>
                    <div className="relative bg-gray-800 rounded-md p-3 text-sm font-mono text-gray-100 break-all">
                      <pre className="whitespace-pre-wrap">
                        {`<div id="paylift-product-card-${product.id}"></div>\n<script src="${getURL()}/static/embed.js" data-product-id="${product.id}" data-creator-id="${creatorProfile.id}" async></script>`}
                      </pre>
                      <CopyLinkButton
                        link={`<div id="paylift-product-card-${product.id}"></div>\n<script src="${getURL()}/static/embed.js" data-product-id="${product.id}" data-creator-id="${creatorProfile.id}" async></script>`}
                        label="Copy"
                        className="absolute top-2 right-2 text-xs text-primary hover:underline p-0 h-auto"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-300">
                <p>No products available for embedding.</p>
                <p className="text-sm mt-2">Add products in the Product Management section to enable embedding.</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="font-semibold mb-4">Recent Activity</h3>
            <div className="text-center py-8 text-gray-300">
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