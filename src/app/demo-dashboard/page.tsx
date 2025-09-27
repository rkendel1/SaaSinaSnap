import Link from 'next/link';
import { 
  ArrowLeft,
  DollarSign, 
  ExternalLink,
  Package, 
  Users, 
  Zap} from 'lucide-react';

import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { CopyLinkButton } from '@/features/creator/components/copy-link-button';

// Mock data for demo
const mockDashboardStats = {
  total_revenue: 2450.75,
  total_sales: 12,
  active_products: 3,
  recent_sales_count: 8
};

const mockCreatorProducts = [
  { 
    id: '1', 
    name: 'Starter Plan', 
    price: 9.99, 
    product_type: 'subscription',
    status: 'active'
  },
  { 
    id: '2', 
    name: 'Pro Plan', 
    price: 29.99, 
    product_type: 'subscription',
    status: 'active'
  },
  { 
    id: '3', 
    name: 'Enterprise Plan', 
    price: 99.99, 
    product_type: 'subscription',
    status: 'draft'
  }
];

const mockCreatorProfile = {
  business_name: 'Demo SaaS Company',
  page_slug: 'demo-company'
};

// Import the component we created (this would be the actual import in the real app)
import { DashboardQuickActions } from '../creator/(protected)/dashboard/components/DashboardQuickActions';

export default function DemoDashboardPage() {
  const storefrontUrl = `https://demo.staryer.com/c/${mockCreatorProfile.page_slug}`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button asChild variant="outline" size="sm">
              <Link href="/" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Enhanced Dashboard Demo</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">Demo Mode</span>
            <Button size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Implementation
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Logo />
            <h1 className="text-3xl font-bold text-gray-900">
              {mockCreatorProfile.business_name || 'Creator Dashboard'}
            </h1>
          </div>
          <p className="text-gray-600">
            Welcome to your enhanced dashboard! Here&apos;s your platform overview with improved organization.
          </p>
        </div>

        {/* Demo Notice */}
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">🎯 Dashboard Improvements Demonstrated</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Organized collapsible sections</strong> group related functionality</li>
            <li>• <strong>Visual indicators</strong> show status and progress at a glance</li>
            <li>• <strong>Enhanced product overview</strong> with status badges and quick actions</li>
            <li>• <strong>Improved quick stats</strong> with better visual hierarchy</li>
            <li>• <strong>Contextual actions</strong> for streamlined workflow</li>
          </ul>
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
                <span className="font-medium text-gray-900 text-lg">${mockDashboardStats.total_revenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Sales</span>
                <span className="font-medium text-gray-900">{mockDashboardStats.total_sales}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Products</span>
                <span className="font-medium text-gray-900 flex items-center gap-1">
                  {mockDashboardStats.active_products}
                  {mockDashboardStats.active_products > 0 && (
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  )}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Recent Sales (30d)</span>
                <span className="font-medium text-gray-900">{mockDashboardStats.recent_sales_count}</span>
              </div>
              {mockDashboardStats.total_revenue > 0 && (
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
                <span className="font-medium text-gray-900">{mockCreatorProducts.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Page Views (30d)</span>
                <span className="font-medium text-gray-900">1,247</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Conversion Rate</span>
                <span className="font-medium text-gray-900">3.2%</span>
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
            {mockCreatorProducts.length > 0 ? (
              <div className="space-y-3">
                {mockCreatorProducts.slice(0, 3).map(product => (
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
                {mockCreatorProducts.length > 3 && (
                  <div className="text-center pt-2">
                    <Button asChild variant="link" className="text-sm text-blue-600">
                      <Link href="/creator/products-and-tiers">
                        View {mockCreatorProducts.length - 3} more products
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

        {/* Implementation Details */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold mb-4 text-gray-900">Implementation Summary</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3 text-gray-900">✅ Completed Improvements</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Created collapsible sections for Quick Actions</li>
                <li>• Grouped related functionality logically</li>
                <li>• Added visual status indicators</li>
                <li>• Enhanced product overview with status badges</li>
                <li>• Improved stats display with icons and better layout</li>
                <li>• Added contextual action buttons</li>
                <li>• Maintained responsive design</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-3 text-gray-900">🎯 Key Benefits</h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• <strong>Better Organization:</strong> Related features grouped together</li>
                <li>• <strong>Reduced Cognitive Load:</strong> Collapsible sections reduce clutter</li>
                <li>• <strong>Quick Status Recognition:</strong> Visual indicators for immediate understanding</li>
                <li>• <strong>Improved Navigation:</strong> Clear pathways to important functions</li>
                <li>• <strong>Enhanced Efficiency:</strong> Quick actions without page changes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}