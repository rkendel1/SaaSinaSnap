'use client';

import { ArrowRight, Rocket } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { PlatformSettings } from '../../types';

interface WelcomeStepProps {
  settings: PlatformSettings;
  onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps) {
  return (
    <div className="space-y-6 text-center">
      <Rocket className="h-16 w-16 mx-auto text-primary" />
      {/* Adjusted text color */}
      <h2 className="text-2xl font-bold text-gray-900">Welcome, Platform Owner!</h2>
      {/* Adjusted text color */}
      <p className="text-gray-600 text-lg max-w-xl mx-auto">
        This guided setup will help you configure your PayLift platform to onboard SaaS creators and manage your ecosystem.
      </p>

      /* Adjusted for light theme */
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-left space-y-4">
        {/* Adjusted text color */}
        <h3 className="font-semibold text-blue-800">What you'll set up:</h3>
        {/* Adjusted text color */}
        <ul className="list-disc list-inside text-sm text-blue-700 space-y-2">
          <li>Verification of essential environment variables</li>
          <li>Default branding and page settings for new creators</li>
          <li>An overview of user roles and permissions</li>
          <li>Confirmation that your platform is ready for launch!</li>
        </ul>
      </div>

      <Button onClick={onNext} size="lg" className="min-w-[180px]">
        Start Setup
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>

      {/* Adjusted text color */}
      <p className="text-sm text-gray-600 pt-4">
        This process typically takes 5-10 minutes.
      </p>
    </div>
  );
}