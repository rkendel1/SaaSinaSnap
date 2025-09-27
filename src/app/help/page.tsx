import { HelpCenter } from '@/components/ui/help-center';

export default function HelpPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-6xl mx-auto px-4">
        <HelpCenter />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Help Center - SaaSinaSnap',
  description: 'Find answers, guides, and resources to help you succeed with your SaaS platform.',
};