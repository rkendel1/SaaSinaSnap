import React from 'react';

export default function DemoOnboardingPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-8">
      <div className="container max-w-4xl mx-auto">
        <div className="space-y-8">
          {/* Welcome Section - NEW */}
          <div className="text-center space-y-4">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Glad you&apos;re here! 🎉</h1>
              <p className="text-lg text-gray-700 mb-4">
                Welcome to your platform setup. Let&apos;s get you up and running quickly.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
              <h3 className="font-semibold text-blue-900 mb-3">What to expect:</h3>
              <div className="text-sm text-blue-800 space-y-2 text-left">
                <p>✅ <strong>Quick Setup (3-4 steps):</strong> Business info, profile, integrations, and launch</p>
                <p>🚀 <strong>Fast Launch:</strong> Get your platform running in minutes</p>
                <p>🎨 <strong>Post-Launch Tasks:</strong> Customize your storefront, add products, and set up embeds at your own pace</p>
                <p>🤖 <strong>AI Assistance:</strong> We&apos;ll help you throughout the process with smart suggestions</p>
              </div>
            </div>
          </div>

          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-gray-900">Business Setup & Brand Analysis</h2>
            <p className="text-gray-600">
              Let&apos;s set up your business profile and analyze your brand to create a personalized experience.
            </p>
          </div>

          {/* Mock form content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Website & Brand Analysis</h3>
                <p className="text-sm text-gray-600">
                  We&apos;ll analyze your website to extract brand colors, fonts, and styling
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website URL</label>
                <input 
                  type="url" 
                  placeholder="https://your-website.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 placeholder:text-gray-500"
                />
              </div>

              <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                Analyze My Brand
              </button>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Onboarding Progress</span>
              <span className="text-sm text-gray-600">Step 1 of 4</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '25%' }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Business Setup</span>
              <span>Profile</span>
              <span>Integrations</span>
              <span>Launch</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              This is a demo of the new onboarding experience with welcome messaging and streamlined flow.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}