import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Eye, UserCog, Package } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getSession } from '@/features/account/controllers/get-session';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { getCreatorProducts } from '@/features/creator-onboarding/controllers/creator-products';
import { CopyLinkButton } from '@/features/creator/components/copy-link-button';
import { getURL } from '@/utils/get-url';

export default async function CreatorDashboardPage() {
  const session = await getSession();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const [creatorProfile, creatorProducts] = await Promise.all([
    getCreatorProfile(session.user.id),
    getCreatorProducts(session.user.id),
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
                <span className="text-gray-600">Total Sales</span>
                <span className="font-medium text-gray-900">$0.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Active Customers</span>
                <span className="font-medium text-gray-900">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Products</span>
                <span className="font-medium text-gray-900">{creatorProducts.length}</span>
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
                <Link href="/creator/profile" className="flex items-center gap-2">
                  <UserCog className="h-4 w-4" />
                  <span>Edit Profile & Branding</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Embeddable Products Section */}
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold mb-4 text-gray-900">Embed Options</h3>
            <p className="text-gray-600 text-sm mb-4">
              Integrate your products directly into any website. Choose an embed type below.
            </p>
            
            <Tabs defaultValue="product-card" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="product-card">Product Card</TabsTrigger>
                <TabsTrigger value="checkout-button">Checkout Button</TabsTrigger>
                <TabsTrigger value="header">Header</TabsTrigger>
              </TabsList>
              <TabsContent value="product-card" className="mt-4 space-y-4">
                {creatorProducts.map((product) => (
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
                ))}
              </TabsContent>
              <TabsContent value="checkout-button" className="mt-4 space-y-4">
                {creatorProducts.map((product) => (
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
                ))}
              </TabsContent>
              <TabsContent value="header" className="mt-4 space-y-4">
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
      </div>
    </div>
  );
}