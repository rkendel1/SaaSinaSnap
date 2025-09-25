import { EnhancedABTestingManager } from '@/features/creator/components/EnhancedABTestingManager';

export default function DemoABTestingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Enhanced A/B Testing Manager Demo</h1>
            <p className="text-gray-600">Experience the comprehensive A/B testing platform</p>
          </div>
          <div className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
            Demo Mode
          </div>
        </div>
      </div>
      <div className="p-6">
        <EnhancedABTestingManager creatorId="demo-creator-123" />
      </div>
    </div>
  );
}