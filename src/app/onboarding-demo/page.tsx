import { Metadata } from 'next';

import { OnboardingDemoComponent } from './onboarding-demo-component';

export const metadata: Metadata = {
  title: 'Enhanced Onboarding Demo - PayLift',
  description: 'Preview of the improved SaaS creator signup and onboarding experience',
};

export default function OnboardingDemoPage() {
  return <OnboardingDemoComponent />;
}
