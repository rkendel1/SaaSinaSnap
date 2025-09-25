'use client';

import { useEffect,useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { SuccessAnimation, useSuccessAnimation } from '@/components/ui/success-animation';
import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser

import { completeOnboardingStepAction } from '../actions/onboarding-actions';
import { getCreatorProfile } from '../controllers/creator-profile';
import type { CreatorProfile, OnboardingStep } from '../types';

import { AIGeneratedPagesStep } from './steps/AIGeneratedPagesStep';
import { CompletionStep } from './steps/CompletionStep';
import { CreatorSetupStep } from './steps/CreatorSetupStep';
import { StripeConnectStep } from './steps/StripeConnectStep';
import { WebsiteUrlStep } from './steps/WebsiteUrlStep';
import { OnboardingProgress } from './OnboardingProgress';
import { type BusinessTypeOption,PersonalizationStep } from './PersonalizationStep';

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: 'Website URL',
    description: 'Provide your website for brand analysis',
    component: 'WebsiteUrlStep',
    completed: false,
  },
  {
    id: 2,
    title: 'Stripe Connect',
    description: 'Connect your Stripe account for payments',
    component: 'StripeConnectStep',
    completed: false,
  },
  {
    id: 3,
    title: 'Business Info',
    description: 'Review and confirm your business details',
    component: 'CreatorSetupStep',
    completed: false,
  },
  {
    id: 4,
    title: 'AI Page Generation',
    description: 'Let AI create your storefront pages',
    component: 'AIGeneratedPagesStep',
    completed: false,
  },
  {
    id: 5,
    title: 'Completion',
    description: 'Your SaaS is ready!',
    component: 'CompletionStep',
    completed: false,
  },
];

interface CreatorOnboardingFlowProps {
  profile: CreatorProfile;
  onClose: (completed?: boolean) => void;
}

export function CreatorOnboardingFlow({ profile: initialProfile, onClose }: CreatorOnboardingFlowProps) {
  const [internalProfile, setInternalProfile] = useState<CreatorProfile>(initialProfile);
  const [currentStep, setCurrentStep] = useState(internalProfile.onboarding_step || 1);
  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const { isSuccess, triggerSuccess } = useSuccessAnimation();

  const currentStepSubmitRef = useState<(() => Promise<void>) | null>(null);

  const totalSteps = ONBOARDING_STEPS.length;

  // Effect to update steps when internalProfile changes
  useEffect(() => {
    setSteps(ONBOARDING_STEPS.map((step) => ({
      ...step,
      completed: Boolean(step.id < (internalProfile.onboarding_step || 1) || (step.id === (internalProfile.onboarding_step || 1) && internalProfile.onboarding_completed)),
    })));
  }, [internalProfile.onboarding_step, internalProfile.onboarding_completed]);

  const handleNext = async () => {
    if (currentStepSubmitRef[0]) {
      try {
        await currentStepSubmitRef[0]();
        const updatedProfile = await getCreatorProfile(internalProfile.id);
        if (updatedProfile) {
          setInternalProfile(updatedProfile);
        }
      } catch (error) {
        console.error("Error submitting step:", error);
        return;
      }
    }

    if (currentStep < totalSteps) {
      triggerSuccess();
      setCurrentStep(currentStep + 1);
    } else {
      onClose(true);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSaveForLater = async () => {
    if (currentStepSubmitRef[0]) {
      try {
        await currentStepSubmitRef[0]();
        const updatedProfile = await getCreatorProfile(internalProfile.id);
        if (updatedProfile) {
          setInternalProfile(updatedProfile);
        }
      } catch (error) {
        console.error("Error saving for later:", error);
        return;
      }
    }
    await completeOnboardingStepAction(currentStep);
    onClose(false);
  };

  const renderCurrentStep = () => {
    const step = steps.find(s => s.id === currentStep);
    if (!step) return <div>Step not found</div>;

    const stepProps = {
      profile: internalProfile,
      onNext: handleNext,
      onPrevious: handlePrevious,
      isFirst: currentStep === 1,
      isLast: currentStep === totalSteps,
      setSubmitFunction: (func: (() => Promise<void>) | null) => {
        currentStepSubmitRef[0] = func;
      },
    };

    switch (step.component) {
      case 'WebsiteUrlStep':
        return <WebsiteUrlStep {...stepProps} />;
      case 'StripeConnectStep':
        return <StripeConnectStep {...stepProps} />;
      case 'CreatorSetupStep':
        return <CreatorSetupStep {...stepProps} />;
      case 'AIGeneratedPagesStep':
        return <AIGeneratedPagesStep {...stepProps} />;
      case 'CompletionStep':
        return <CompletionStep {...stepProps} onComplete={onClose} />;
      default:
        return <div>Step not found</div>;
    }
  };

  const currentStepTitle = steps.find(s => s.id === currentStep)?.title || 'Onboarding';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-8">
      <div className="container max-w-4xl mx-auto">
        <div className="space-y-4 pb-6 border-b border-gray-200">
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
        </div>

        <div className="py-4">
          {renderCurrentStep()}
        </div>

        {currentStep !== totalSteps && (
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleSaveForLater}
                disabled={false}
                className="flex items-center gap-2 border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Save for Later
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
          </div>
        )}
      </div>

      <SuccessAnimation
        isVisible={isSuccess}
        message="Step completed successfully!"
        duration={1500}
      />
    </div>
  );
}