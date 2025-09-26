import Link from 'next/link';

import { Button } from '@/components/ui/button';

export default function CreatorOnboardingDemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            SaaS Creator Onboarding Flow
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Complete implementation of creator onboarding with right-to-left sliding panels, 
            Stripe Connect integration, and white-labeled page generation.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">👤</span>
            </div>
            <h3 className="font-semibold mb-2">Creator Setup</h3>
            <p className="text-sm text-muted-foreground">
              Multi-step form for business profile setup with validation and progress tracking
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">💳</span>
            </div>
            <h3 className="font-semibold mb-2">Stripe Connect</h3>
            <p className="text-sm text-muted-foreground">
              Seamless integration with Stripe Connect for payment processing and account management
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">⚡</span>
            </div>
            <h3 className="font-semibold mb-2">Streamlined Setup</h3>
            <p className="text-sm text-muted-foreground">
              Faster onboarding with product setup deferred until after initial configuration
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🎨</span>
            </div>
            <h3 className="font-semibold mb-2">White-Label Pages</h3>
            <p className="text-sm text-muted-foreground">
              Customizable branded storefronts with real-time preview and domain configuration
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🔗</span>
            </div>
            <h3 className="font-semibold mb-2">Webhooks</h3>
            <p className="text-sm text-muted-foreground">
              Configure webhooks for real-time notifications and system integrations
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="font-semibold mb-2">Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Track performance, sales metrics, and customer behavior with built-in analytics
            </p>
          </div>
        </div>

        {/* Onboarding Steps Preview */}
        <div className="bg-white rounded-xl shadow-sm border p-8 mb-12">
          <h2 className="text-2xl font-semibold mb-6 text-center">6-Step Onboarding Process</h2>
          <div className="grid grid-cols-6 gap-4">
            {[
              { step: 1, title: 'Creator Setup', icon: '👤' },
              { step: 2, title: 'Stripe Connect', icon: '💳' },
              { step: 3, title: 'White-Label Setup', icon: '🎨' },
              { step: 4, title: 'Webhooks', icon: '🔗' },
              { step: 5, title: 'Review', icon: '✅' },
              { step: 6, title: 'Launch', icon: '🚀' },
            ].map((item, index) => (
              <div key={item.step} className="text-center">
                <div className="h-12 w-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold mx-auto mb-2">
                  {item.step}
                </div>
                <div className="text-2xl mb-1">{item.icon}</div>
                <p className="text-xs font-medium">{item.title}</p>
                {index < 6 && (
                  <div className="h-0.5 bg-gradient-to-r from-blue-300 to-purple-300 mt-2 hidden lg:block"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Technical Implementation */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-8 text-white mb-12">
          <h2 className="text-2xl font-semibold mb-6">Technical Implementation</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold mb-3">Database Schema</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• creator_profiles - Business information & settings</li>
                <li>• creator_products - Product catalog management</li>
                <li>• white_labeled_pages - Custom storefront pages</li>
                <li>• creator_webhooks - Webhook configurations</li>
                <li>• creator_analytics - Performance metrics</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3">Key Features</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Right-to-left sliding panels using Sheet component</li>
                <li>• Server actions for form processing</li>
                <li>• Stripe Connect API integration</li>
                <li>• Real-time progress tracking</li>
                <li>• Responsive design for all devices</li>
              </ul>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
          <h2 className="text-2xl font-semibold mb-4">Experience the Full Onboarding Flow</h2>
          <p className="mb-6 text-blue-100">
            This implementation includes all components for a complete SaaS creator onboarding experience.
            The sliding panel interface provides an intuitive, step-by-step setup process.
          </p>
          <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
            View Implementation Details
          </Button>
        </div>
      </div>
    </div>
  );
}