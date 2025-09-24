'use client';

import { useState } from 'react';
import { CheckCircle, ExternalLink, Eye, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getURL } from '@/utils/get-url'; // Import getURL

import { completeOnboardingStepAction } from '../../actions/onboarding-actions';
import type { CreatorProfile } from '../../types';

interface ReviewStepProps {
  profile: CreatorProfile;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function ReviewStep({ profile, onNext }: ReviewStepProps) {
  const [isLaunching, setIsLaunching] = useState(false);

  const handleLaunch = async () => {
    setIsLaunching(true);
    try {
      await completeOnboardingStepAction(6);
      onNext();
    } catch (error) {
      console.error('Failed to launch SaaS:', error);
    } finally {
      setIsLaunching(false);
    }
  };

  const setupItems = [
    {
      title: 'Creator Profile',
      description: profile.business_name || 'Business information set up',
      completed: !!profile.business_name,
      action: 'Edit Profile',
    },
    {
      title: 'Stripe Connect',
      description: profile.stripe_account_enabled ? 'Payment processing enabled' : 'Stripe account connected',
      completed: !!profile.stripe_account_id,
      action: 'View Stripe Dashboard',
    },
    {
      title: 'Products',
      description: 'Products imported and configured',
      completed: true, // Assume completed for demo
      action: 'Manage Products',
    },
    {
      title: 'White-Label Pages',
      description: 'Branded storefront ready',
      completed: true, // Assume completed for demo
      action: 'Customize Pages',
    },
    {
      title: 'Webhooks',
      description: 'Real-time notifications configured',
      completed: true, // Assume completed for demo
      action: 'Manage Webhooks',
    },
  ];

  const allCompleted = setupItems.every(item => item.completed);
  const storeFrontUrl = profile.custom_domain 
    ? `https://${profile.custom_domain}` 
    : `${getURL()}/c/${profile.id}`; // Use getURL() here

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          {allCompleted ? (
            <CheckCircle className="h-6 w-6 text-green-600" />
          ) : (
            <Settings className="h-6 w-6 text-blue-600" />
          )}
        </div>
        {/* Adjusted text color */}
        <h2 className="text-xl font-semibold mb-2 text-gray-900">
          {allCompleted ? 'Ready to Launch!' : 'Review Your Setup'}
        </h2>
        {/* Adjusted text color */}
        <p className="text-gray-600">
          {allCompleted 
            ? 'Everything looks good. Your SaaS platform is ready to go live!' 
            : 'Review your configuration and make any final adjustments before launching.'
          }
        </p>
      </div>

      <div className="space-y-4">
        {/* Adjusted text color */}
        <h3 className="font-medium text-gray-900">Setup Checklist</h3>
        {setupItems.map((item, index) => (
          /* Adjusted for light theme */
          <div key={index} className={`border rounded-lg p-4 ${item.completed ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {item.completed ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <div className="h-5 w-5 rounded-full border-2 border-yellow-500"></div>
                  )}
                </div>
                <div>
                  {/* Adjusted text color */}
                  <h4 className="font-medium text-sm text-gray-900">{item.title}</h4>
                  {/* Adjusted text color */}
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
              {/* Adjusted text color */}
              <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700">
                {item.action}
              </Button>
            </div>
          </div>
        ))}
      </div>

      /* Adjusted for light theme */
      <div className="border border-gray-200 rounded-lg p-6 bg-white">
        {/* Adjusted text color */}
        <h3 className="font-medium mb-2 flex items-center gap-2 text-gray-900">
          <Eye className="h-4 w-4" />
          Your Storefront
        </h3>
        {/* Adjusted text color */}
        <p className="text-sm text-gray-600 mb-4">
          Your white-labeled storefront is ready for customers:
        </p>
        {/* Adjusted for light theme */}
        <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200">
          {/* Adjusted text color */}
          <code className="text-sm font-mono text-blue-600">{storeFrontUrl}</code>
          {/* Adjusted for light theme */}
          <Button variant="outline" size="sm" className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100">
            <ExternalLink className="h-3 w-3" />
            <span>Preview</span>
          </Button>
        </div>
      </div>

      {allCompleted && (
        /* Adjusted for light theme */
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          {/* Adjusted text color */}
          <h3 className="font-medium text-green-800 mb-2">🎉 Congratulations!</h3>
          {/* Adjusted text color */}
          <p className="text-sm text-green-700">
            Your SaaS platform is fully configured and ready to accept customers. 
            Click &ldquo;Launch My SaaS&rdquo; to make it live!
          </p>
        </div>
      )}

      <div className="space-y-3">
        <Button 
          onClick={handleLaunch} 
          disabled={!allCompleted || isLaunching}
          className="w-full"
          size="lg"
        >
          {isLaunching ? 'Launching...' : allCompleted ? 'Launch My SaaS' : 'Complete Setup First'}
        </Button>
        
        {!allCompleted && (
          /* Adjusted for light theme */
          <Button 
            variant="outline"
            onClick={onNext}
            className="w-full border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Continue Anyway
          </Button>
        )}
      </div>

      <div className="text-center">
        {/* Adjusted text color */}
        <p className="text-xs text-gray-600">
          Need help? Check out our{' '}
          {/* Adjusted text color */}
          <a href="/docs" className="text-blue-600 hover:underline">documentation</a>{' '}
          or{' '}
          {/* Adjusted text color */}
          <a href="/support" className="text-blue-600 hover:underline">contact support</a>.
        </p>
      </div>
    </div>
  );
}