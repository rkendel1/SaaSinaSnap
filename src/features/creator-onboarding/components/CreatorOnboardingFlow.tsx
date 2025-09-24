'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

import type { CreatorProfile, OnboardingStep } from '../types';

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
  isOpen: boolean;
  onClose: (completed?: boolean) => void; // Updated signature
}

export function CreatorOnboardingFlow({ profile, isOpen, onClose }: CreatorOnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(profile.onboarding_step || 1);
  const [steps, setSteps] = useState(() =>
    ONBOARDING_STEPS.map((step) => ({
      ...step,
      completed: step.id < (profile.onboarding_step || 1),
    }))
  );

  const currentStepData = steps.find((step) => step.id === currentStep);
  const progressPercentage = ((currentStep - 1) / (ONBOARDING_STEPS.length - 1)) * 100;

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length) {
      setSteps((prevSteps) =>
        prevSteps.map((step) =>
          step.id === currentStep ? { ...step, completed: true } : step
        )
      );
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
      isLast: currentStep === ONBOARDING_STEPS.length,
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
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full max-w-2xl overflow-y-auto">
        <SheetHeader className="space-y-4">
          <SheetTitle className="text-2xl font-bold">Creator Onboarding</SheetTitle>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Step {currentStep} of {ONBOARDING_STEPS.length}</span>
              <span>{Math.round(progressPercentage)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {currentStepData && (
            <div className="text-center space-y-1">
              <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
              <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
            </div>
          )}
        </SheetHeader>

        <div className="mt-8">
          {renderCurrentStep()}
        </div>

        {/* Navigation Footer */}
        {currentStep !== ONBOARDING_STEPS.length && (
          <div className="flex justify-between items-center mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex gap-1">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`h-2 w-8 rounded-full ${
                    step.completed
                      ? 'bg-primary'
                      : step.id === currentStep
                      ? 'bg-primary/50'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </div>

            <Button
              onClick={handleNext}
              disabled={currentStep === ONBOARDING_STEPS.length}
              className="flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}