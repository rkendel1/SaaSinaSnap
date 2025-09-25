'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link'; // Added import for Link
import { BarChart3, CheckCircle, CreditCard, ExternalLink, Users, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getURL } from '@/utils/get-url'; // Import getURL

import { updateCreatorProfileAction } from '../../actions/onboarding-actions';
import type { CreatorProfile } from '../../types';

interface CompletionStepProps {
  profile: CreatorProfile;
  onComplete: (completed: boolean) => void; // Changed signature
  isFirst: boolean;
  isLast: boolean;
  setSubmitFunction: (func: (() => Promise<void>) | null) => void; // New prop
}

export function CompletionStep({ profile, onComplete, setSubmitFunction }: CompletionStepProps) {
  const storeFrontUrl = `${getURL()}/c/${profile.page_slug}`; // Use profile.page_slug

  const dashboardUrl = '/creator/dashboard';

  const features = [
    {
      icon: <CreditCard className="h-5 w-5" />,
      title: 'Turnkey Stripe Integration',
      description: 'Accept payments, manage subscriptions, and handle payouts effortlessly.',
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: 'White-Label Customer Portal',
      description: 'Your customers manage their subscriptions under your brand.',
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: 'Automated Analytics',
      description: 'Track sales, conversions, and customer behavior in real-time.',
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'AI-Powered Page Generation',
      description: 'Instantly create branded landing, pricing, and account pages.',
    },
  ];

  const nextSteps = [
    {
      title: 'Share Your Storefront',
      description: 'Start promoting your new SaaS to potential customers',
      action: 'Copy Link',
      link: storeFrontUrl,
    },
    {
      title: 'Monitor Performance',
      description: 'Keep track of sales and customer activity',
      action: 'View Analytics',
      link: '/creator/dashboard/analytics',
    },
    {
      title: 'Customize Further',
      description: 'Fine-tune your pages and add more products',
      action: 'Go to Design Studio',
      link: '/design-studio',
    },
    {
      title: 'Get Support',
      description: 'Join our community and access helpful resources',
      action: 'Visit Help Center',
      link: '/support',
    },
  ];

  // This step doesn't have a form to submit, but we need to provide a dummy function
  // so the parent flow can call it without error.
  const handleSubmit = async () => {
    // No data to save in this step, just mark as completed
    await updateCreatorProfileAction({
      onboarding_completed: true,
      onboarding_step: 6, // Mark as the final step
    });
    await onComplete(true);
  };

  // Expose handleSubmit to the parent component
  useEffect(() => {
    setSubmitFunction(handleSubmit);
    return () => setSubmitFunction(null); // Clean up on unmount
  }, [setSubmitFunction, onComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6 text-center">
      <div>
        <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-green-700">
          🎉 Your SaaS is Live!
        </h2>
        <p className="text-gray-600 text-lg">
          Congratulations! <strong>{profile.business_name || 'Your SaaS'}</strong> is now fully integrated and ready to serve customers.
        </p>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-gray-200">
        <h3 className="font-semibold mb-4 text-gray-900">Your new SaaS platform includes:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5 text-green-700">
                {feature.icon}
              </div>
              <div>
                <h4 className="font-medium text-sm text-gray-900">{feature.title}</h4>
                <p className="text-xs text-gray-700">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between bg-gray-100 rounded-lg p-4 border border-gray-200 shadow-sm">
          <div className="text-left">
            <h4 className="font-medium text-gray-900">Your Storefront URL</h4>
            <code className="text-sm text-blue-600 font-mono">{storeFrontUrl}</code>
          </div>
          <Button variant="outline" size="sm" className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100" asChild>
            <a href={storeFrontUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3" />
              <span>Open Store</span>
            </a>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={handleSubmit}
            size="lg"
            className="flex items-center gap-2"
            asChild
          >
            <Link href={dashboardUrl}>
              <span>Go to Dashboard</span>
            </Link>
          </Button>
          <Button 
            variant="outline"
            size="lg"
            className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100"
            asChild
            onClick={() => window.open(storeFrontUrl, '_blank')}
          >
            <Link href={storeFrontUrl} target="_blank" rel="noopener noreferrer">
              <span>
                <ExternalLink className="h-4 w-4" />
                View Storefront
              </span>
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Recommended Next Steps</h3>
        <div className="grid gap-3">
          {nextSteps.map((step, index) => (
            <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-100">
              <div className="text-left">
                <h4 className="font-medium text-sm text-gray-900">{step.title}</h4>
                <p className="text-xs text-gray-700">{step.description}</p>
              </div>
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700" asChild>
                <Link href={step.link} target={step.action === 'Copy Link' ? '_self' : '_blank'} rel="noopener noreferrer">
                  {step.action}
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-800 mb-2">🚀 Pro Tips for Success</h3>
        <ul className="text-sm text-blue-700 text-left space-y-1">
          <li>• Test your payment flow by making a small test purchase</li>
          <li>• Set up email notifications for new customers and sales</li>
          <li>• Create compelling product descriptions and pricing</li>
          <li>• Share your storefront on social media and with your network</li>
        </ul>
      </div>

      <div className="text-center pt-4">
        <p className="text-sm text-gray-600">
          Questions? We&apos;re here to help!{' '}
          <a href="/support" className="text-blue-600 hover:underline">Contact Support</a>
        </p>
      </div>
    </div>
  );
}