import { EnvironmentSwitcher } from '@/features/creator-onboarding/components/EnvironmentSwitcher';

export default function EnvironmentTestPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Environment Management Test
          </h1>
          <p className="text-gray-600">
            Test the creator onboarding environment management functionality
          </p>
        </div>
        
        <EnvironmentSwitcher />
      </div>
    </div>
  );
}