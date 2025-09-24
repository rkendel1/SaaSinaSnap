'use client';

import { ArrowRight, LayoutDashboard, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { PlatformSettings } from '../../types';

interface CreatorOnboardingReviewStepProps {
  settings: PlatformSettings;
  onNext: () => void;
}

export function CreatorOnboardingReviewStep({ onNext }: CreatorOnboardingReviewStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <UserPlus className="h-12 w-12 mx-auto mb-4 text-primary" />
        {/* Adjusted text color */}
        <h2 className="text-xl font-semibold mb-2 text-gray-900">Creator Onboarding Flow Review</h2>
        {/* Adjusted text color */}
        <p className="text-gray-600">
          Understand the journey your creators will take when they sign up for PayLift.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        /* Adjusted for light theme */
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          {/* Adjusted text color */}
          <h3 className="font-semibold text-lg mb-2 flex items-center gap-2 text-gray-900">
            <UserPlus className="h-5 w-5" />
            Creator Signup
          </h3>
          {/* Adjusted text color */}
          <p className="text-sm text-gray-600 mb-4">
            Creators will sign up using email or OAuth (Google/GitHub) and then be directed to their onboarding flow.
          </p>
          {/* Adjusted text color */}
          <ul className="list-disc list-inside text-xs text-gray-500 space-y-1">
            <li>Authentication via Supabase Auth</li>
            <li>Initial profile creation</li>
            <li>Redirect to onboarding if not completed</li>
          </ul>
        </div>

        /* Adjusted for light theme */
        <div className="bg-white rounded-lg p-6 border border-gray-200">
          {/* Adjusted text color */}
          <h3 className="font-semibold text-lg mb-2 flex items-center gap-2 text-gray-900">
            <LayoutDashboard className="h-5 w-5" />
            Multi-Step Onboarding
          </h3>
          {/* Adjusted text color */}
          <p className="text-sm text-gray-600 mb-4">
            The creator onboarding is a multi-step process covering business setup, payments, products, and storefront customization.
          </p>
          {/* Adjusted text color */}
          <ul className="list-disc list-inside text-xs text-gray-500 space-y-1">
            <li>Business Profile & Branding</li>
            <li>Stripe Connect Integration</li>
            <li>Product Management</li>
            <li>White-Label Storefront Setup</li>
            <li>Webhook Configuration</li>
            <li>Review & Launch</li>
          </ul>
        </div>
      </div>

      /* Adjusted for light theme */
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 text-sm">
        <p className="font-medium mb-2">Testing the Creator Flow:</p>
        <p>
          After completing this platform owner onboarding, you can test the full creator signup and onboarding experience by navigating to the `/creator/onboarding` route.
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}