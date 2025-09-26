import React from 'react';

export default function DemoTasksPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with progress */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Your Setup</h2>
            <p className="text-gray-600">
              Finish these tasks to unlock the full potential of your platform. Take your time - you can complete them at your own pace.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm text-gray-600">1 of 5 completed</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '20%' }}></div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">📋 High Priority Tasks</h4>
            <p className="text-sm text-blue-800">
              Start with these essential tasks to get the most value from your platform:
            </p>
            <div className="mt-2 space-y-1">
              <div className="text-sm text-blue-700">• Product Setup (10-15 minutes)</div>
              <div className="text-sm text-blue-700">• Storefront / White-Label (15-20 minutes)</div>
            </div>
          </div>
        </div>

        {/* Task Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Product Setup - High Priority */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 relative">
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Product Setup</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">high</span>
                      <span className="text-xs text-gray-500">10-15 minutes</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">Import/create products and configure usage/subscription tiers</p>
              
              <div className="space-y-2 mb-4">
                <p className="text-sm font-medium text-gray-700">Set up your products and pricing tiers to start selling</p>
                
                <div className="flex flex-wrap gap-2">
                  <button className="bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700">
                    Add Products
                  </button>
                  <button className="border border-gray-300 text-gray-700 py-1 px-3 rounded text-sm hover:bg-gray-50">
                    Import from Stripe
                  </button>
                </div>

                <button className="w-full justify-between text-xs bg-blue-50 text-blue-700 py-2 px-3 rounded flex items-center hover:bg-blue-100">
                  🤖 AI Assistance Available
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h5 className="text-xs font-medium text-blue-900 mb-2">AI will help you with:</h5>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• AI suggestions based on your business type</li>
                    <li>• Stripe product import and validation</li>
                    <li>• Pricing optimization recommendations</li>
                    <li>• Product description templates</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Storefront Customization - High Priority */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Storefront / White-Label</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">high</span>
                      <span className="text-xs text-gray-500">15-20 minutes</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">Customize your AI-generated storefront pages</p>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Customize your storefront design and content to match your brand</p>
                
                <div className="flex flex-wrap gap-2">
                  <button className="bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700">
                    Customize Storefront
                  </button>
                  <button className="border border-gray-300 text-gray-700 py-1 px-3 rounded text-sm hover:bg-gray-50">
                    Design Templates
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Embeds & Widgets - Medium Priority */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Embeds & Widgets</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">medium</span>
                      <span className="text-xs text-gray-500">5-10 minutes</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">Add embeddable components for external usage</p>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Create embeddable widgets for your website and marketing</p>
                
                <div className="flex flex-wrap gap-2">
                  <button className="bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700">
                    Create Embeds
                  </button>
                  <button className="border border-gray-300 text-gray-700 py-1 px-3 rounded text-sm hover:bg-gray-50">
                    View Templates
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Integrations - Medium Priority */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Integrations & Webhooks</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-700">medium</span>
                      <span className="text-xs text-gray-500">10-15 minutes</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-gray-600 text-sm mb-4">Connect Slack, Zapier, analytics, and CRMs</p>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Connect your favorite tools and services</p>
                
                <div className="flex flex-wrap gap-2">
                  <button className="bg-blue-600 text-white py-1 px-3 rounded text-sm hover:bg-blue-700">
                    Setup Integrations
                  </button>
                  <button className="border border-gray-300 text-gray-700 py-1 px-3 rounded text-sm hover:bg-gray-50">
                    Configure Webhooks
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Review & Optimize - Low Priority with Completed State */}
          <div className="bg-green-50 border-green-200 rounded-lg shadow-sm border relative">
            <div className="absolute top-3 right-3">
              <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="p-6">
              <div className="flex items-start justify-between mb-3 pr-8">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Review & Optimize</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">completed</span>
                      <span className="text-xs text-gray-500">5 minutes</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-green-800 text-sm mb-4">✅ Setup is complete and optimized</p>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-green-700">Your setup has been reviewed and optimized</p>
                
                <div className="flex flex-wrap gap-2">
                  <button className="bg-green-600 text-white py-1 px-3 rounded text-sm hover:bg-green-700">
                    View Report
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-500">
            This is a demo of the new post-onboarding task dashboard with AI assistance and progress tracking.
          </p>
        </div>
      </div>
    </div>
  );
}