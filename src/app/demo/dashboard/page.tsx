import { PostHogSaaSDashboardDemo } from '@/features/creator/components/PostHogSaaSDashboardDemo';

export default function DemoDashboardPage() {
  // Mock creator profile for demo
  const mockCreatorProfile = {
    id: 'demo-creator-123',
    display_name: 'Demo Creator',
    brand_name: 'Demo SaaS Company'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">PostHog SaaS Dashboard Demo</h1>
            <p className="text-gray-600">Experience the comprehensive analytics platform</p>
          </div>
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            Demo Mode
          </div>
        </div>
      </div>
      <PostHogSaaSDashboardDemo creatorProfile={mockCreatorProfile} />
    </div>
  );
}