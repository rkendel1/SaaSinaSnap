import { notFound } from 'next/navigation';

import { EnhancedCustomerPortal } from '@/features/creator/components/EnhancedCustomerPortal';
import { getCreatorBySlug } from '@/features/creator/controllers/get-creator-by-slug';

interface CustomerPortalPageProps {
  params: Promise<{ creatorSlug: string }>;
  searchParams: Promise<{ customer_id?: string }>;
}

export default async function CustomerPortalPage({ params, searchParams }: CustomerPortalPageProps) {
  const { creatorSlug } = await params;
  const { customer_id } = await searchParams;
  
  // Get creator profile
  const creator = await getCreatorBySlug(creatorSlug);
  if (!creator) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Account Portal</h1>
              <p className="text-gray-600">Manage your subscription and account settings</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Powered by</p>
              <p className="font-semibold">{creator.business_name || 'SaaSinaSnap'}</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
        <EnhancedCustomerPortal 
          creatorSlug={creatorSlug}
          customerId={customer_id}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-16">
        <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
          <div className="text-center text-sm text-gray-600">
            <p>© 2024 {creator.business_name || 'SaaSinaSnap'}. All rights reserved.</p>
            <p className="mt-1">
              Questions? Contact us at{' '}
              <a href={`mailto:support@${creator.page_slug}.com`} className="text-blue-600 hover:underline">
                support@{creator.page_slug}.com
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}