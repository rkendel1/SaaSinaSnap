import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ExternalLink, Eye,Globe, LayoutTemplate, Plus, Settings } from 'lucide-react';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { WhiteLabeledPage } from '@/features/creator/types';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { getWhiteLabeledPages } from '@/features/creator-onboarding/controllers/white-labeled-pages';
import { getURL } from '@/utils/get-url';

export default async function WhiteLabelSitesPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  const [creatorProfile, whiteLabeledPages] = await Promise.all([
    getCreatorProfile(authenticatedUser.id),
    getWhiteLabeledPages(authenticatedUser.id),
  ]);

  if (!creatorProfile || !creatorProfile.onboarding_completed) {
    redirect('/creator/onboarding');
  }

  const getPageUrl = (pageSlug: string) => `${getURL()}/c/${creatorProfile.page_slug}/${pageSlug === 'landing' ? '' : pageSlug}`;

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <LayoutTemplate className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">White-Label Sites</h1>
            <p className="text-gray-600">
              Manage your branded storefronts and customer-facing pages.
            </p>
          </div>
        </div>
        <Link href="/creator/storefront/customize">
          <button className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="h-4 w-4 mr-2" />
            Customize Storefront
          </button>
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your Storefront</h2>
          <p className="text-sm text-gray-600 mt-1">
            This is your primary white-labeled storefront, accessible to your customers.
          </p>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div>
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Main Storefront
              </h3>
              <code className="text-sm text-blue-600 font-mono mt-1 block">
                {getPageUrl('landing')}
              </code>
            </div>
            <div className="flex gap-2">
              <Link href={getPageUrl('landing')} target="_blank" rel="noopener noreferrer">
                <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 text-sm">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  View Live
                </button>
              </Link>
              <Link href="/creator/storefront/customize">
                <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 text-sm">
                  <Settings className="h-4 w-4 mr-1" />
                  Customize
                </button>
              </Link>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-medium text-gray-900 mb-3">Individual Pages</h3>
            <div className="grid gap-4">
              {whiteLabeledPages.map((page: WhiteLabeledPage) => (
                <div key={page.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                  <div>
                    <h4 className="font-medium text-gray-900">{page.page_title || page.page_slug}</h4>
                    <p className="text-sm text-gray-600">
                      {page.page_slug === 'landing' ? 'Home Page' : `${page.page_title || page.page_slug} Page`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={getPageUrl(page.page_slug)} target="_blank" rel="noopener noreferrer">
                      <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 text-sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Preview
                      </button>
                    </Link>
                    <Link href="/creator/storefront/customize"> {/* Link to general customize for now */}
                      <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 text-sm">
                        <Settings className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 text-sm">
        <h3 className="font-medium text-blue-900 mb-2">💡 Tip:</h3>
        <p>
          Your white-labeled pages automatically pull branding and product information from your profile and "Products & Tiers" settings.
          Any changes there will be reflected here instantly.
        </p>
      </div>
    </div>
  );
}