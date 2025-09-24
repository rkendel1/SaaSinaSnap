"use client";

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { OnboardingProgress } from '@/features/creator-onboarding/components/OnboardingProgress';
import { SuccessAnimation, useSuccessAnimation } from '@/components/ui/success-animation'; // Import SuccessAnimation

import { completePlatformOnboardingStepAction } from '../actions/platform-actions';
import type { PlatformOnboardingStep, PlatformSettings } from '../types';

// Import step components
import { CreatorOnboardingReviewStep } from './steps/CreatorOnboardingReviewStep';
import { DefaultCreatorSettingsStep } from './steps/DefaultCreatorSettingsStep';
import { EnvVarReviewStep } from './steps/EnvVarReviewStep';
import { PlatformCompletionStep } from './steps/PlatformCompletionStep';
import { RoleManagementOverviewStep } from './steps/RoleManagementOverviewStep';
import { WelcomeStep } from './steps/WelcomeStep';

const PLATFORM_ONBOARDING_STEPS: PlatformOnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome to PayLift Admin',
    description: 'Get started with your platform setup',
    component: 'WelcomeStep',
    completed: false,
  },
  {
    id: 2,
    title: 'Environment Variables',
    description: 'Verify your critical environment configurations',
    component: 'EnvVarReviewStep',
    completed: false,
  },
  {
    id: 3,
    title: 'Default Creator Settings',
    description: 'Set default branding and page configs for new creators',
    component: 'DefaultCreatorSettingsStep',
    completed: false,
  },
  {
    id: 4,
    title: 'Role Management Overview',
    description: 'Understand user roles and permissions',
    component: 'RoleManagementOverviewStep',
    completed: false,
  },
  {
    id: 5,
    title: 'Creator Onboarding Review',
    description: 'Familiarize yourself with the creator signup flow',
    component: 'CreatorOnboardingReviewStep',
    completed: false,
  },
  {
    id: 6,
    title: 'Platform Setup Complete!',
    description: 'Your PayLift platform is ready for creators',
    component: 'PlatformCompletionStep',
    completed: false,
  },
];

interface PlatformOwnerOnboardingFlowProps {
  settings: PlatformSettings;
  onClose: () => void;
}

export function PlatformOwnerOnboardingFlow({ settings, onClose }: PlatformOwnerOnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1); // Always start at step 1 for this flow
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
    };

    switch (currentStepData?.component) {
      case 'WelcomeStep':
        return <WelcomeStep {...stepProps} />;
      case 'EnvVarReviewStep':
        return <EnvVarReviewStep {...stepProps} />;
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
    <div className="min-h-screen bg-gray-950 text-gray-50 py-8">
      <div className="container max-w-4xl mx-auto">
        <div className="space-y-4 pb-6 border-b border-gray-700">
          <h2 className="text-2xl font-bold">Platform Owner Onboarding</h2>
          
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
              <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
              <p className="text-sm text-gray-300">{currentStepData.description}</p>
            </div>
          )}
        </div>

        <div className="py-8">
          {renderCurrentStep()}
        </div>

        {/* Navigation Footer */}
        <div className="border-t border-gray-700 pt-6 mt-8">
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center gap-2 border-gray-700 text-gray-100 hover:bg-gray-800"
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