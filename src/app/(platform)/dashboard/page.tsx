import Link from 'next/link';
import { BarChart3, DollarSign, Eye, Settings, TestTube, Users, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getCurrentEnvironmentAction, getEnvironmentConfigAction } from '@/features/platform-owner-onboarding/actions/environment-actions';
import { EnvironmentSwitcher } from '@/features/platform-owner-onboarding/components/EnvironmentSwitcher';

async function PlatformDashboardPage() {
  let currentEnvironment: 'test' | 'production' = 'test';
  let testEnabled = false;
  let productionEnabled = false;

  try {
    currentEnvironment = await getCurrentEnvironmentAction();
    const testConfig = await getEnvironmentConfigAction('test');
    const prodConfig = await getEnvironmentConfigAction('production');
    testEnabled = !!testConfig?.is_active;
    productionEnabled = !!prodConfig?.is_active;
  } catch (error) {
    console.error('Failed to load environment config:', error);
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-gray-900">Platform Dashboard</h1>
            <p className="text-gray-600">Manage your entire SaaSinaSnap platform, creators, and products from here.</p>
          </div>
          
          <EnvironmentSwitcher
            currentEnvironment={currentEnvironment}
            testEnabled={testEnabled}
            productionEnabled={productionEnabled}
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {currentEnvironment === 'test' ? (
                <TestTube className="h-6 w-6 text-blue-600" />
              ) : (
                <Zap className="h-6 w-6 text-green-600" />
              )}
              <div>
                <h3 className="font-semibold text-gray-900">
                  Current Environment: <span className={currentEnvironment === 'test' ? 'text-blue-700' : 'text-green-700'}>
                    {currentEnvironment === 'test' ? 'Test Mode' : 'Production Mode'}
                  </span>
                </h3>
                <p className="text-sm text-gray-600">
                  {currentEnvironment === 'test' 
                    ? 'Platform is running in test mode - safe for development and testing'
                    : 'Platform is running in production mode - processing real payments'
                  }
                </p>
              </div>
            </div>
            
            <div className="ml-auto flex gap-2">
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                testEnabled ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
              }`}>
                Test: {testEnabled ? 'Connected' : 'Not Connected'}
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                productionEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
              }`}>
                Production: {productionEnabled ? 'Connected' : 'Not Connected'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold mb-4 text-gray-900 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Revenue Dashboard
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Track platform revenue, fees, and creator earnings across your platform.
          </p>
          <Button asChild>
            <Link href="/platform/dashboard/revenue">View Revenue</Link>
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold mb-4 text-gray-900 flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Manage Platform Products
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Add, edit, and archive the subscription plans you offer to your creators.
          </p>
          <Button asChild variant="outline">
            <Link href="/platform/dashboard/products">Manage Products</Link>
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold mb-4 text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Analytics Dashboard
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Monitor platform performance, user engagement, and creator activity.
          </p>
          <Button asChild variant="outline">
            <Link href="/platform/dashboard/analytics">View Analytics</Link>
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold mb-4 text-gray-900 flex items-center gap-2">
            <Users className="h-5 w-5" />
            Manage Creators
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            View and manage all the creators who have signed up on your platform.
          </p>
          <Button asChild variant="outline">
            <Link href="/platform/dashboard/creators">View Creators</Link>
          </Button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold mb-4 text-gray-900 flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Environment Settings
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Configure test and production Stripe environments for your platform.
          </p>
          <Button asChild variant="outline">
            <Link href="/platform-owner-onboarding">Environment Setup</Link>
          </Button>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">Preview Your Embeds</h3>
            <p className="text-sm text-gray-600 mt-1">
              Test how your platform&apos;s product cards and checkout buttons will look on any website.
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
  );
}

export default PlatformDashboardPage;