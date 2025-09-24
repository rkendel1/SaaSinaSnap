'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { SuccessAnimation, useSuccessAnimation } from '@/components/ui/success-animation';

import type { CreatorProfile, OnboardingStep } from '../types';

import { OnboardingProgress } from './OnboardingProgress';
import { PersonalizationStep, type BusinessTypeOption } from './PersonalizationStep';
import { CompletionStep } from './steps/CompletionStep';
import { CreatorSetupStep } from './steps/CreatorSetupStep';
import { ProductImportStep } from './steps/ProductImportStep';
import { ReviewStep } from './steps/ReviewStep';
import { StripeConnectStep } from './steps/StripeConnectStep';
import { WebhookSetupStep } from './steps/WebhookSetupStep';
import { WhiteLabelSetupStep } from './steps/WhiteLabelSetupStep';

const BASE_ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: 'Business Setup',
    description: 'Configure your business profile and branding',
    component: 'CreatorSetupStep',
    completed: false,
  },
  {
    id: 2,
    title: 'Payment Setup',
    description: 'Connect your Stripe account for payments',
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
    title: 'Storefront',
    description: 'Customize your branded storefront',
    component: 'WhiteLabelSetupStep',
    completed: false,
  },
  {
    id: 5,
    title: 'Webhooks',
    description: 'Configure webhooks and integrations',
    component: 'WebhookSetupStep',
    completed: false,
  },
  {
    id: 6,
    title: 'Review',
    description: 'Review and finalize your setup',
    component: 'ReviewStep',
    completed: false,
  },
  {
    id: 7,
    title: 'Complete',
    description: 'Your SaaS platform is ready!',
    component: 'CompletionStep',
    completed: false,
  },
];

interface EnhancedOnboardingFlowProps {
  profile: CreatorProfile;
  isOpen: boolean;
  onClose: () => void;
}

export function EnhancedOnboardingFlow({ profile, isOpen, onClose }: EnhancedOnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(0); // Start with personalization (-1 would be before first step)
  const [steps, setSteps] = useState<OnboardingStep[]>(BASE_ONBOARDING_STEPS);
  const [businessType, setBusinessType] = useState<BusinessTypeOption | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [showPersonalization, setShowPersonalization] = useState(true);
  const { isSuccess, triggerSuccess } = useSuccessAnimation();

  // Calculate actual progress (excluding personalization step)
  const actualCurrentStep = showPersonalization ? 0 : currentStep;
  const totalSteps = steps.length;
  
  // Update step completion
  const markStepComplete = (stepId: number) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed: true } : step
    ));
    triggerSuccess();
  };

  // Handle personalization completion
  const handlePersonalizationComplete = (type: BusinessTypeOption, features: string[]) => {
    setBusinessType(type);
    setSelectedFeatures(features);
    setShowPersonalization(false);
    setCurrentStep(1);
    
    // Customize steps based on business type
    let customizedSteps = [...BASE_ONBOARDING_STEPS];
    
    // Skip certain steps based on business type
    if (type.id === 'nonprofit') {
      // For nonprofits, maybe skip advanced webhook setup
      customizedSteps = customizedSteps.filter(step => step.component !== 'WebhookSetupStep');
    }
    
    if (type.id === 'services' && !features.includes('product_catalog')) {
      // For service businesses without products, simplify product import
      customizedSteps = customizedSteps.map(step => 
        step.component === 'ProductImportStep' 
          ? { ...step, title: 'Service Setup', description: 'Configure your service offerings' }
          : step
      );
    }
    
    setSteps(customizedSteps);
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      markStepComplete(steps[currentStep - 1]?.id);
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    } else if (currentStep === 1) {
      setShowPersonalization(true);
      setCurrentStep(0);
    }
  };

  const renderCurrentStep = () => {
    if (showPersonalization) {
      return (
        <PersonalizationStep
          onComplete={handlePersonalizationComplete}
          onSkip={() => {
            setShowPersonalization(false);
            setCurrentStep(1);
          }}
        />
      );
    }

    const step = steps[currentStep - 1];
    if (!step) return null;

    const stepProps = {
      profile,
      onNext: handleNext,
      onPrevious: handleBack, // Pass handleBack for previous
      isFirst: currentStep === 1,
      isLast: currentStep === totalSteps,
      businessType,
      selectedFeatures,
    };

    switch (step.component) {
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
        return <CompletionStep {...stepProps} onComplete={onClose} />; // CompletionStep uses onComplete
      default:
        return <div>Step not found</div>;
    }
  };

  const currentStepTitle = showPersonalization 
    ? 'Personalize Your Experience'
    : steps[currentStep - 1]?.title || 'Onboarding';

  return (
    <>
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent 
          side="right" 
          className="w-full sm:max-w-4xl overflow-y-auto bg-gray-950 text-gray-50"
        >
          <SheetHeader className="space-y-4 pb-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl">
                {currentStepTitle}
              </SheetTitle>
              <div className="text-sm text-gray-300">
                {businessType && (
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs">
                    {businessType.title}
                  </span>
                )}
              </div>
            </div>
            
            {/* Progress indicator - only show when not in personalization */}
            {!showPersonalization && (
              <OnboardingProgress
                steps={steps.map(step => ({
                  id: step.id,
                  title: step.title,
                  description: step.description,
                  completed: step.completed,
                }))}
                currentStep={currentStep}
              />
            )}
          </SheetHeader>

          <div className="py-8">
            {renderCurrentStep()}
          </div>

          {/* Navigation - only show when not in personalization */}
          {!showPersonalization && (
            <div className="border-t border-gray-700 pt-6 mt-8">
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep <= 1}
                  className="flex items-center gap-2 border-gray-700 text-gray-100 hover:bg-gray-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </Button>
                
                <div className="flex items-center gap-3">
                  {currentStep < totalSteps ? (
                    <Button onClick={handleNext} className="flex items-center gap-2">
                      Continue
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button onClick={onClose} className="bg-green-600 hover:bg-green-700">
                      Complete Setup
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Success animation overlay */}
      <SuccessAnimation
        isVisible={isSuccess}
        message="Step completed successfully!"
        duration={1500}
      />
    </>
  );
}