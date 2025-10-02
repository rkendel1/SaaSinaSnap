import Image from 'next/image';
import Link from 'next/link';
import { AlertCircle, BarChart3, CheckCircle2, CreditCard, Download, FileText, Settings, TrendingUp, User } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CustomerTierPortal } from '@/features/usage-tracking/components/CustomerTierPortal';
import { type CreatorBranding, getBrandingStyles } from '@/utils/branding-utils';

import { CreatorProfile, WhiteLabeledPage } from '../types';

import { CustomerNotifications, sampleNotifications } from './customer-notifications';

interface CreatorAccountPageProps {
  creator: CreatorProfile;
  pageConfig: WhiteLabeledPage;
}

export function CreatorAccountPage({ creator, pageConfig }: CreatorAccountPageProps) {
  // Create branding object from creator profile
  const branding: CreatorBranding = {
    brandColor: creator.brand_color || '#ea580c',
    brandGradient: creator.brand_gradient,
    brandPattern: creator.brand_pattern,
  };
  
  const brandingStyles = getBrandingStyles(branding);
  
  return (
    <div className="min-h-screen bg-gray-50" style={brandingStyles.cssVariables}>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
          <div className="flex items-center justify-between">
            <Link href={`/c/${creator.page_slug}`}>
              {creator.business_logo_url ? (
                <Image
                  src={creator.business_logo_url}
                  alt={creator.business_name || 'Business Logo'}
                  className="h-10 w-auto"
                />
              ) : (
                <div 
                  className="text-2xl font-bold" 
                  style={brandingStyles.gradientText}
                >
                  {creator.business_name || 'SaaSinaSnap'}
                </div>
              )}
            </Link>
            
            <nav className="flex items-center gap-6">
              <Link 
                href={`/c/${creator.page_slug}`}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Home
              </Link>
              <Link 
                href={`/c/${creator.page_slug}/pricing`}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Pricing
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 
            className="text-4xl font-bold mb-4"
            style={brandingStyles.gradientText}
          >
            {pageConfig.heroTitle || 'Account Management'}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl">
            {pageConfig.heroSubtitle || 'Manage your subscription, billing, and account settings'}
          </p>
        </div>

        {/* Customer Notifications */}
        <CustomerNotifications 
          notifications={sampleNotifications}
          onDismiss={(id) => console.log('Dismiss notification:', id)}
        />

        {/* Customer Tier Portal */}
        <div className="mb-8">
          <CustomerTierPortal creatorId={creator.id} />
        </div>

        {/* Account Management Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Subscription Management */}
          <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="p-2 rounded-lg"
                style={brandingStyles.softGradientBackground}
              >
                <CreditCard className="h-6 w-6" style={brandingStyles.accent} />
              </div>
              <h3 className="text-lg font-semibold">Subscription</h3>
            </div>
            <p className="text-gray-600 mb-4">
              View and manage your subscription plans, billing cycles, and payment methods.
            </p>
            <Link href={`/c/${creator.page_slug}/manage-subscription`}>
              <Button 
                className="w-full"
                style={brandingStyles.primaryButton}
              >
                Manage Subscription
              </Button>
            </Link>
          </div>

          {/* Usage & Analytics */}
          <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="p-2 rounded-lg"
                style={brandingStyles.softGradientBackground}
              >
                <BarChart3 className="h-6 w-6" style={brandingStyles.accent} />
              </div>
              <h3 className="text-lg font-semibold">Usage Analytics</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Track your usage statistics, trends, and optimize your plan.
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              style={brandingStyles.outlineButton}
            >
              View Analytics
            </Button>
          </div>

          {/* Account Settings */}
          <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="p-2 rounded-lg"
                style={brandingStyles.softGradientBackground}
              >
                <Settings className="h-6 w-6" style={brandingStyles.accent} />
              </div>
              <h3 className="text-lg font-semibold">Settings</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Update your profile, preferences, and account information.
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              style={brandingStyles.outlineButton}
            >
              Account Settings
            </Button>
          </div>

          {/* Profile Management */}
          <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="p-2 rounded-lg"
                style={brandingStyles.softGradientBackground}
              >
                <User className="h-6 w-6" style={brandingStyles.accent} />
              </div>
              <h3 className="text-lg font-semibold">Profile</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Manage your profile information, avatar, and personal details.
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              style={brandingStyles.outlineButton}
            >
              Edit Profile
            </Button>
          </div>

          {/* Download Center */}
          <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="p-2 rounded-lg"
                style={brandingStyles.softGradientBackground}
              >
                <Download className="h-6 w-6" style={brandingStyles.accent} />
              </div>
              <h3 className="text-lg font-semibold">Downloads</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Access your downloads, invoices, and account statements.
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              style={brandingStyles.outlineButton}
            >
              View Downloads
            </Button>
          </div>

          {/* Support */}
          <div className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="p-2 rounded-lg"
                style={brandingStyles.softGradientBackground}
              >
                <svg className="h-6 w-6" style={brandingStyles.accent} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold">Support</h3>
            </div>
            <p className="text-gray-600 mb-4">
              Get help, contact support, or browse our knowledge base.
            </p>
            <Button 
              variant="outline" 
              className="w-full"
              style={brandingStyles.outlineButton}
            >
              Get Support
            </Button>
          </div>
        </div>

        {/* Billing History & Usage Overview */}
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {/* Subscription Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Subscription Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Subscription Status Banner */}
              <div className="mb-4 p-4 rounded-lg border bg-green-50 border-green-200">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">
                      Your subscription is active
                    </p>
                    <p className="text-sm text-green-700">
                      Next billing date: January 15, 2025
                    </p>
                  </div>
                </div>
              </div>

              {/* Plan Details */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Plan</p>
                  <p className="text-xl font-bold text-gray-900">Professional Plan</p>
                  <p className="text-sm text-gray-600">Advanced features for growing teams</p>
                </div>

                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-700">Billing Amount</span>
                    <span className="font-semibold text-gray-900">$29.00/month</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700">Next Payment</span>
                    <span className="text-sm text-gray-900">January 15, 2025</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Link href={`/c/${creator.page_slug}/manage-subscription`}>
                    <Button 
                      className="w-full"
                      style={brandingStyles.primaryButton}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Manage Subscription
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Billing History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Recent Billing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Monthly Subscription</p>
                    <p className="text-sm text-gray-600">December 2024</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">$29.00</p>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      Paid
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Monthly Subscription</p>
                    <p className="text-sm text-gray-600">November 2024</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">$29.00</p>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      Paid
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">Monthly Subscription</p>
                    <p className="text-sm text-gray-600">October 2024</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">$29.00</p>
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      Paid
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t">
                <Link href={`/c/${creator.page_slug}/manage-subscription`}>
                  <Button variant="outline" className="w-full" size="sm">
                    View All Billing History
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Plan Features & Usage */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Plan Features & Usage This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">API Calls</span>
                  <span className="text-sm font-medium">8,500 / 10,000</span>
                </div>
                <Progress value={85} className="h-2" />
                <p className="text-xs text-amber-600 mt-1">85% used - Consider upgrading soon</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Storage</span>
                  <span className="text-sm font-medium">2.1 GB / 5 GB</span>
                </div>
                <Progress value={42} className="h-2" />
                <p className="text-xs text-green-600 mt-1">Well within limits</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Team Members</span>
                  <span className="text-sm font-medium">3 / 5</span>
                </div>
                <Progress value={60} className="h-2" />
                <p className="text-xs text-blue-600 mt-1">2 seats available</p>
              </div>
            </div>
            
            {/* Upgrade Prompt */}
            <div className="mt-6 p-4 rounded-lg border" style={brandingStyles.softGradientBackground}>
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">Need more capacity?</h4>
                  <p className="text-sm text-gray-700">
                    Upgrade to unlock higher limits and advanced features.
                  </p>
                </div>
                <Link href={`/c/${creator.page_slug}/pricing`}>
                  <Button 
                    variant="outline" 
                    style={brandingStyles.outlineButton}
                  >
                    View Plans
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-2xl font-bold mb-6" style={brandingStyles.gradientText}>
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link href={`/c/${creator.page_slug}/manage-subscription`}>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                style={brandingStyles.outlineButton}
              >
                <CreditCard className="h-4 w-4" />
                Update Payment Method
              </Button>
            </Link>
            <Link href={`/c/${creator.page_slug}/manage-subscription`}>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                style={brandingStyles.outlineButton}
              >
                <Download className="h-4 w-4" />
                Download Latest Invoice
              </Button>
            </Link>
            <Link href={`/c/${creator.page_slug}/pricing`}>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                style={brandingStyles.outlineButton}
              >
                <TrendingUp className="h-4 w-4" />
                Upgrade Plan
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              style={brandingStyles.outlineButton}
            >
              <Settings className="h-4 w-4" />
              Account Preferences
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 {creator.business_name || 'SaaSinaSnap'}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}