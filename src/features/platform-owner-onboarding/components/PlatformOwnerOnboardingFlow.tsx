"use client";

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SuccessAnimation, useSuccessAnimation } from '@/components/ui/success-animation'; // Import SuccessAnimation
import { OnboardingProgress } from '@/features/creator-onboarding/components/OnboardingProgress';

import { completePlatformOnboardingStepAction } from '../actions/platform-actions';
import type { PlatformOnboardingStep, PlatformSettings } from '../types';

// Import step components
import { CreatorOnboardingReviewStep } from './steps/CreatorOnboardingReviewStep';
import { DefaultCreatorSettingsStep } from './steps/DefaultCreatorSettingsStep';
import { EnvVarReviewStep } from './steps/EnvVarReviewStep';
import { PlatformCompletionStep } from './steps/PlatformCompletionStep';
import { PlatformStripeConnectStep } from './steps/PlatformStripeConnectStep'; // Import new step
import { RoleManagementOverviewStep } from './steps/RoleManagementOverviewStep';
import { WelcomeStep } from './steps/WelcomeStep';

const PLATFORM_ONBOARDING_STEPS: PlatformOnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome',
    description: 'Get started with your platform setup',
    component: 'WelcomeStep',
    completed: false,
  },
  {
    id: 2,
    title: 'Environment Variables',
    description: 'Verify your critical configurations',
    component: 'EnvVarReviewStep',
    completed: false,
  },
  {
    id: 3,
    title: 'Stripe Connect',
    description: 'Connect your platform Stripe account',
    component: 'PlatformStripeConnectStep',
    completed: false,
  },
  {
    id: 4,
    title: 'Default Creator Settings',
    description: 'Set defaults for new creators',
    component: 'DefaultCreatorSettingsStep',
    completed: false,
  },
  {
    id: 5,
    title: 'Role Management',
    description: 'Understand user roles',
    component: 'RoleManagementOverviewStep',
    completed: false,
  },
  {
    id: 6,
    title: 'Creator Onboarding Review',
    description: 'Review the creator signup flow',
    component: 'CreatorOnboardingReviewStep',
    completed: false,
  },
  {
    id: 7,
    title: 'Platform Setup Complete!',
    description: 'Your platform is ready for creators',
    component: 'PlatformCompletionStep',
    completed: false,
  },
];

interface PlatformOwnerOnboardingFlowProps {
  settings: PlatformSettings;
  onClose: () => void;
}

export function PlatformOwnerOnboardingFlow({ settings, onClose }: PlatformOwnerOnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(settings.onboarding_step || 1);
  const [steps, setSteps] = useState(PLATFORM_ONBOARDING_STEPS);
  const { isSuccess, triggerSuccess } = useSuccessAnimation(); // Initialize success animation

  const currentStepData = steps.find((step) => step.id === currentStep);
  const totalSteps = PLATFORM_ONBOARDING_STEPS.length;

  const handleNext = async () => {
    if (currentStep < totalSteps) {
      // Mark current step as completed
      setSteps((prevSteps) =>
        prevSteps.map((step) =>
          step.id === currentStep ? { ...step, completed: true } : step
        )
      );
      triggerSuccess(); // Trigger success animation on step completion
      // Update backend that this step is completed (optional, but good for tracking)
      await completePlatformOnboardingStepAction(currentStep);
      setCurrentStep(currentStep + 1);
    } else {
      // Onboarding is complete
      await completePlatformOnboardingStepAction(currentStep); // Mark final step complete
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderCurrentStep = () => {
    const stepProps = {
      settings,
      onNext: handleNext,
      onPrevious: handlePrevious,
      isFirst: currentStep === 1,
      isLast: currentStep === totalSteps,
      setSubmitFunction: (func: (() => Promise<void>) | null) => {}, // Dummy function for now
    };

    switch (currentStepData?.component) {
      case 'WelcomeStep':
        return <WelcomeStep {...stepProps} />;
      case 'EnvVarReviewStep':
        return <EnvVarReviewStep {...stepProps} />;
      case 'PlatformStripeConnectStep':
        return <PlatformStripeConnectStep {...stepProps} />;
      case 'DefaultCreatorSettingsStep':
        return <DefaultCreatorSettingsStep {...stepProps} />;
      case 'RoleManagementOverviewStep':
        return <RoleManagementOverviewStep {...stepProps} />;
      case 'CreatorOnboardingReviewStep':
        return <CreatorOnboardingReviewStep {...stepProps} />;
      case 'PlatformCompletionStep':
        return <PlatformCompletionStep {...stepProps} onComplete={onClose} />;
      default:
        return <div>Step not found</div>;
    }
  };

  return (
    /* Adjusted for light theme */
    <div className="min-h-screen bg-gray-50 text-gray-900 py-8">
      <div className="container max-w-4xl mx-auto">
        {/* Adjusted border color */}
        <div className="space-y-4 pb-6 border-b border-gray-200">
          {/* Adjusted text color */}
          <h2 className="text-2xl font-bold text-gray-900">Platform Owner Onboarding</h2>
          
          <OnboardingProgress
            steps={steps.map(step => ({
              id: step.id,
              title: step.title,
              description: step.description,
              completed: step.completed,
            }))}
            currentStep={currentStep}
          />

          {currentStepData && (
            <div className="text-center space-y-1">
              {/* Adjusted text color */}
              <h3 className="text-lg font-semibold text-gray-900">{currentStepData.title}</h3>
              {/* Adjusted text color */}
              <p className="text-sm text-gray-600">{currentStepData.description}</p>
            </div>
          )}
        </div>

        <div className="py-8">
          {renderCurrentStep()}
        </div>

        {/* Navigation Footer */}
        /* Adjusted border color */
        <div className="border-t border-gray-200 pt-6 mt-8">
          <div className="flex justify-between">
            /* Adjusted for light theme */
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <Button
              onClick={handleNext}
              className="flex items-center gap-2"
            >
              {currentStep === totalSteps ? 'Finish Setup' : 'Continue'}
              {currentStep !== totalSteps && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Success animation overlay */}
      <SuccessAnimation
        isVisible={isSuccess}
        message="Step completed successfully!"
        duration={1500}
      />
    </div>
  );
}