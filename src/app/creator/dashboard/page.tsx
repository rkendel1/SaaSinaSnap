import { redirect } from 'next/navigation';
import Link from 'next/link'; // Import Link
import { Eye } from 'lucide-react'; // Import Eye icon

import { Button } from '@/components/ui/button'; // Keep Button for other uses
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'; // Import Tabs components
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
    <div className="min-h-screen bg-gray-50"> {/* Changed bg-muted/30 to bg-gray-50 */}
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Creator Dashboard</h1> {/* Adjusted text color */}
          <p className="text-gray-600"> {/* Adjusted text color */}
            Welcome back, {creatorProfile.business_name || 'Creator'}! Manage your SaaS platform from here.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Quick Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"> {/* Adjusted border color */}
            <h3 className="font-semibold mb-4 text-gray-900">Quick Stats</h3> {/* Adjusted text color */}
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Sales</span> {/* Adjusted text color */}
                <span className="font-medium text-gray-900">$0.00</span> {/* Adjusted text color */}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Customers</span> {/* Adjusted text color */}
                <span className="font-medium text-gray-900">0</span> {/* Adjusted text color */}
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Products</span> {/* Adjusted text color */}
                <span className="font-medium text-gray-900">{creatorProducts.length}</span> {/* Adjusted text color */}
              </div>
            </div>
          </div>

          {/* Storefront Link */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"> {/* Adjusted border color */}
            <h3 className="font-semibold mb-4 text-gray-900">Your Storefront</h3> {/* Adjusted text color */}
            <div className="space-y-3">
              <p className="text-sm text-gray-600 mb-4"> {/* Adjusted text color */}
                Share your storefront with customers:
              </p>
              <div className="p-3 bg-gray-100 rounded-md border border-gray-200"> {/* Adjusted for light theme */}
                <code className="text-xs break-all text-blue-600"> {/* Adjusted text color */}
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
                    <span>Open Store</span>
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"> {/* Adjusted border color */}
            <h3 className="font-semibold mb-4 text-gray-900">Quick Actions</h3> {/* Adjusted text color */}
            <div className="space-y-2">
              <Button asChild variant="ghost" className="w-full justify-start text-gray-700 hover:bg-gray-100"> {/* Adjusted for light theme */}
                <Link href="/creator/onboarding"><span>Add New Product</span></Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start text-gray-700 hover:bg-gray-100"> {/* Adjusted for light theme */}
                <Link href="/creator/onboarding"><span>Customize Storefront</span></Link>
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start text-gray-700 hover:bg-gray-100"> {/* Adjusted for light theme */}
                <Link href="/creator/dashboard"><span>View Analytics</span></Link> {/* Links to dashboard for now */}
              </Button>
              <Button asChild variant="ghost" className="w-full justify-start text-gray-700 hover:bg-gray-100"> {/* Adjusted for light theme */}
                <Link href="/creator/onboarding"><span>Manage Webhooks</span></Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Embeddable Products Section */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"> {/* Adjusted border color */}
            <h3 className="font-semibold mb-4 text-gray-900">Embed Options</h3> {/* Adjusted text color */}
            <p className="text-gray-600 text-sm mb-4"> {/* Adjusted text color */}
              Integrate your products directly into any website. Choose an embed type below.
            </p>
            
            {creatorProfile ? ( // Ensure creatorProfile exists before rendering tabs
              <Tabs defaultValue="product-card" className="w-full">
                <TabsList className="grid w-full grid-cols-3"> {/* Changed to 3 columns */}
                  <TabsTrigger value="product-card">Product Card</TabsTrigger>
                  <TabsTrigger value="checkout-button">Checkout Button</TabsTrigger>
                  <TabsTrigger value="header">Header</TabsTrigger> {/* New tab for Header */}
                </TabsList>
                <TabsContent value="product-card" className="mt-4 space-y-4">
                  {creatorProducts.length > 0 ? (
                    creatorProducts.map((product) => (
                      <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">{product.name}</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Copy and paste this code into your website&apos;s HTML where you want the product card to appear.
                        </p>
                        <div className="relative bg-gray-100 rounded-md p-3 text-sm font-mono text-gray-900 break-all border border-gray-200">
                          <pre className="whitespace-pre-wrap">
                            {`<div id="paylift-embed-card-${product.id}"></div>\n<script src="${getURL()}/static/embed.js" data-product-id="${product.id}" data-creator-id="${creatorProfile.id}" data-embed-type="card" async></script>`}
                          </pre>
                          <CopyLinkButton
                            link={`<div id="paylift-embed-card-${product.id}"></div>\n<script src="${getURL()}/static/embed.js" data-product-id="${product.id}" data-creator-id="${creatorProfile.id}" data-embed-type="card" async></script>`}
                            label="Copy"
                            className="absolute top-2 right-2 text-xs text-primary hover:underline p-0 h-auto"
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-600">
                      <p>No products available for embedding.</p>
                      <p className="text-sm mt-2">Add products in the Product Management section to enable embedding.</p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="checkout-button" className="mt-4 space-y-4">
                  {creatorProducts.length > 0 ? (
                    creatorProducts.map((product) => (
                      <div key={product.id} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">{product.name}</h4>
                        <p className="text-sm text-gray-600 mb-3">
                          Copy and paste this code into your website&apos;s HTML to add a direct checkout button.
                        </p>
                        <div className="relative bg-gray-100 rounded-md p-3 text-sm font-mono text-gray-900 break-all border border-gray-200">
                          <pre className="whitespace-pre-wrap">
                            {`<div id="paylift-embed-checkout-button-${product.id}"></div>\n<script src="${getURL()}/static/embed.js" data-product-id="${product.id}" data-creator-id="${creatorProfile.id}" data-stripe-price-id="${product.stripe_price_id}" data-embed-type="checkout-button" async></script>`}
                          </pre>
                          <CopyLinkButton
                            link={`<div id="paylift-embed-checkout-button-${product.id}"></div>\n<script src="${getURL()}/static/embed.js" data-product-id="${product.id}" data-creator-id="${creatorProfile.id}" data-stripe-price-id="${product.stripe_price_id}" data-embed-type="checkout-button" async></script>`}
                            label="Copy"
                            className="absolute top-2 right-2 text-xs text-primary hover:underline p-0 h-auto"
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-600">
                      <p>No products available for embedding.</p>
                      <p className="text-sm mt-2">Add products in the Product Management section to enable embedding.</p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="header" className="mt-4 space-y-4"> {/* New TabsContent for Header */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Branded Header</h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Copy and paste this code into the `&lt;body&gt;` section of your website&apos;s HTML, ideally at the top, to embed a branded navigation header.
                    </p>
                    <div className="relative bg-gray-100 rounded-md p-3 text-sm font-mono text-gray-900 break-all border border-gray-200">
                      <pre className="whitespace-pre-wrap">
                        {`<div id="paylift-embed-header"></div>\n<script src="${getURL()}/static/embed.js" data-creator-id="${creatorProfile.id}" data-embed-type="header" async></script>`}
                      </pre>
                      <CopyLinkButton
                        link={`<div id="paylift-embed-header"></div>\n<script src="${getURL()}/static/embed.js" data-creator-id="${creatorProfile.id}" data-embed-type="header" async></script>`}
                        label="Copy"
                        className="absolute top-2 right-2 text-xs text-primary hover:underline p-0 h-auto"
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="text-center py-8 text-gray-600">
                <p>No embed options available yet.</p>
                <p className="text-sm mt-2">Complete your onboarding and add products to enable embedding.</p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <Button asChild variant="outline" className="flex items-center gap-2">
                <Link href="/creator/dashboard/embed-preview">
                  <Eye className="h-4 w-4" />
                  Preview Embeds
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"> {/* Adjusted border color */}
            <h3 className="font-semibold mb-4 text-gray-900">Recent Activity</h3> {/* Adjusted text color */}
            <div className="text-center py-8 text-gray-600"> {/* Adjusted text color */}
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