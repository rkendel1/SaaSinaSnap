'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle, ExternalLink, LayoutDashboard, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { PlatformSettings } from '../../types';

interface PlatformCompletionStepProps {
  settings: PlatformSettings;
  onComplete: () => void; // This prop is called by the parent flow
}

export function PlatformCompletionStep({ settings, onComplete }: PlatformCompletionStepProps) {
  // This step doesn't have a form to submit, but we need to provide a dummy function
  // so the parent flow can call it without error.
  // The parent's onClose (redirectToPlatformDashboard) will be called after this step's submit function is called.
  const handleSubmit = async () => {
    // No data to save in this step, just signal completion to the parent.
    // The parent will then call its onClose prop (redirectToPlatformDashboard).
  };

  // Expose handleSubmit to the parent component
  // The parent will call this function when it's time to complete the step,
  // and then the parent's `onClose` (which is `redirectToPlatformDashboard`) will be invoked.
  // This ensures the redirect happens from the server context.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    // The parent component expects a function to be set here.
    // We'll provide a function that, when called, effectively signals this step's completion.
    // The actual redirect is handled by the parent's `onClose` prop.
    const submitFn = async () => {
      // No async operation needed here, just return to let the parent proceed.
      // The parent's `onClose` will handle the redirect.
    };
    // @ts-ignore
    settings.setSubmitFunction(submitFn);
    // @ts-ignore
    return () => settings.setSubmitFunction(null);
  }, [settings]);


  return (
    <div className="space-y-6 text-center">
      <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-500" />
      {/* Adjusted text color */}
      <h2 className="text-2xl font-bold text-green-800">
        🎉 Platform Setup Complete!
      </h2>
      {/* Adjusted text color */}
      <p className="text-gray-600 text-lg max-w-xl mx-auto">
        Your SaaSinaSnap platform is now fully configured and ready to welcome SaaS creators.
      </p>

      {/* Adjusted for light theme */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border border-gray-200">
        {/* Adjusted text color */}
        <h3 className="font-semibold mb-4 text-gray-900">What you've achieved:</h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left text-sm">
          <li className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            {/* Adjusted text color */}
            <span className="text-gray-600">Verified essential environment variables</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            {/* Adjusted text color */}
            <span className="text-gray-600">Set default branding for new creators</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            {/* Adjusted text color */}
            <span className="text-gray-600">Configured default white-labeled page content</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
            {/* Adjusted text color */}
            <span className="text-gray-600">Understood platform roles and creator onboarding</span>
          </li>
        </ul>
      </div>

      <div className="space-y-4">
        {/* Adjusted text color */}
        <h3 className="font-semibold text-gray-900">Next Steps:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            size="lg"
            className="flex items-center gap-2"
            asChild
          >
            <Link href="/dashboard">
              <span>
                <LayoutDashboard className="h-5 w-5" />
                Go to Platform Dashboard
              </span>
            </Link>
          </Button>
          {/* Adjusted for light theme */}
          <Button 
            variant="outline"
            size="lg"
            className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100"
            asChild
          >
            <Link href="/creator/onboarding">
              <span>
                <UserPlus className="h-5 w-5" />
                Test Creator Onboarding
              </span>
            </Link>
          </Button>
        </div>
      </div>

      {/* Adjusted for light theme */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        {/* Adjusted text color */}
        <h3 className="font-medium text-blue-800 mb-2">💡 Pro Tip:</h3>
        {/* Adjusted text color */}
        <p className="text-sm text-blue-700">
          Share your platform's main URL (`{process.env.NEXT_PUBLIC_SITE_URL}/signup`) with potential creators to get them started!
        </p>
      </div>

      <div className="text-center pt-4">
        {/* Adjusted text color */}
        <p className="text-sm text-gray-600">
          Need further assistance?{' '}
          {/* Adjusted text color */}
          <a href="/support" className="text-blue-600 hover:underline">Contact Support</a>
        </p>
      </div>
    </div>
  );
}