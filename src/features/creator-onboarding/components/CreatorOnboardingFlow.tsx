'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress'; // Keep Progress for now, might replace with OnboardingProgress
import { SuccessAnimation, useSuccessAnimation } from '@/components/ui/success-animation'; // Import SuccessAnimation

import type { CreatorProfile, OnboardingStep } from '../types';

import { OnboardingProgress } from './OnboardingProgress'; // Import OnboardingProgress
import { CompletionStep } from './steps/CompletionStep';
// Import step components
import { CreatorSetupStep } from './steps/CreatorSetupStep';
import { ProductImportStep } from './steps/ProductImportStep';
import { ReviewStep } from './steps/ReviewStep';
import { StripeConnectStep } from './steps/StripeConnectStep';
import { WebhookSetupStep } from './steps/WebhookSetupStep';
import { WhiteLabelSetupStep } from './steps/WhiteLabelSetupStep';

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: 'Creator Setup',
    description: 'Set up your creator profile and business information',
    component: 'CreatorSetupStep',
    completed: false,
  },
  {
    id: 2,
    title: 'Stripe Connect',
    description: 'Connect your Stripe account for payment processing',
    component: 'StripeConnectStep',
    completed: false,
  },
  {
    id: 3,
    title: 'Product Import',
    description: 'Import and manage your products',
    component: 'ProductImportStep',
    completed: false,
  },
  {
    id: 4,
    title: 'White-Label Setup',
    description: 'Customize your branded storefront',
    component: 'WhiteLabelSetupStep',
    completed: false,
  },
  {
    id: 5,
    title: 'Webhook Configuration',
    description: 'Set up webhooks for real-time updates',
    component: 'WebhookSetupStep',
    completed: false,
  },
  {
    id: 6,
    title: 'Review & Launch',
    description: 'Review your setup and go live',
    component: 'ReviewStep',
    completed: false,
  },
  {
    id: 7,
    title: 'Completion',
    description: 'Your SaaS is ready!',
    component: 'CompletionStep',
    completed: false,
  },
];

interface CreatorOnboardingFlowProps {
  profile: CreatorProfile;
  onClose: (completed?: boolean) => void; // Updated signature
}

export function CreatorOnboardingFlow({ profile, onClose }: CreatorOnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(profile.onboarding_step || 1);
  const [steps, setSteps] = useState(() =>
    ONBOARDING_STEPS.map((step) => ({
      ...step,
      completed: step.id < (profile.onboarding_step || 1),
    }))
  );
  const { isSuccess, triggerSuccess } = useSuccessAnimation(); // Initialize success animation

  const currentStepData = steps.find((step) => step.id === currentStep);
  const totalSteps = ONBOARDING_STEPS.length;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setSteps((prevSteps) =>
        prevSteps.map((step) =>
          step.id === currentStep ? { ...step, completed: true } : step
        )
      );
      triggerSuccess(); // Trigger success animation on step completion
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderCurrentStep = () => {
    const stepProps = {
      profile,
      onNext: handleNext,
      onPrevious: handlePrevious,
      isFirst: currentStep === 1,
      isLast: currentStep === totalSteps,
    };

    switch (currentStepData?.component) {
      case 'CreatorSetupStep':
        return <CreatorSetupStep {...stepProps} />;
      case 'StripeConnectStep':
        return <StripeConnectStep {...stepProps} />;
      case 'ProductImportStep':
        return <ProductImportStep {...stepProps} />;
      case 'WhiteLabelSetupStep':
        return <WhiteLabelSetupStep {...stepProps} />;
      case 'WebhookSetupStep':
        return <WebhookSetupStep {...stepProps} />;
      case 'ReviewStep':
        return <ReviewStep {...stepProps} />;
      case 'CompletionStep':
        return <CompletionStep {...stepProps} onComplete={onClose} />; // onClose is passed directly
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
          <h2 className="text-2xl font-bold text-gray-900">Creator Onboarding</h2>
          
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
        {currentStep !== totalSteps && (
          /* Adjusted border color */
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            /* Adjusted for light theme */
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <Button
              onClick={handleNext}
              disabled={currentStep === totalSteps}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
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