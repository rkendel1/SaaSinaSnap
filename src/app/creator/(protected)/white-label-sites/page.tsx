import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ExternalLink, Eye, Globe, LayoutTemplate, Palette, Pause,Play, Plus, Settings } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { WhiteLabeledPage } from '@/features/creator/types';
import { getCreatorProfile } from '@/features/creator-onboarding/controllers/creator-profile';
import { getWhiteLabeledPages } from '@/features/creator-onboarding/controllers/white-labeled-pages';
import { type CreatorBranding,getBrandingStyles } from '@/utils/branding-utils';
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

  // Create branding object from creator profile
  const branding: CreatorBranding = {
    brandColor: creatorProfile.brand_color || '#ea580c',
    brandGradient: creatorProfile.brand_gradient,
    brandPattern: creatorProfile.brand_pattern,
  };
  
  const brandingStyles = getBrandingStyles(branding);

  const getPageUrl = (pageSlug: string) => `${getURL()}/c/${creatorProfile.custom_domain}/${pageSlug === 'landing' ? '' : pageSlug}`;
  const getPreviewUrl = (pageSlug: string) => `${getPageUrl(pageSlug)}?preview=true`;

  // Check if site is published (all pages are active)
  const isPublished = whiteLabeledPages.every(page => page.active);

  return (
    <div className="p-6">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <LayoutTemplate className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">White-Label Sites</h1>
            <p className="text-gray-600">Manage your branded website templates and deployment</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Link href="/creator/white-label-sites/templates">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              style={brandingStyles.outlineButton}
            >
              <Palette className="h-4 w-4" />
              Templates
            </Button>
          </Link>
          <Button 
            className="flex items-center gap-2"
            style={brandingStyles.primaryButton}
          >
            <Plus className="h-4 w-4" />
            Add Page
          </Button>
        </div>
      </div>

      {/* Site Status and Deploy Controls */}
      <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-lg font-semibold">Site Status</h2>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                isPublished 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {isPublished ? 'Published' : 'Draft'}
              </div>
            </div>
            <p className="text-gray-600">
              {isPublished 
                ? 'Your site is live and accessible to visitors'
                : 'Your site is in draft mode - only you can see it with preview links'
              }
            </p>
          </div>
          <div className="flex gap-3">
            <Link href={getPreviewUrl('landing')} target="_blank" rel="noopener noreferrer">
              <Button variant="outline" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview Site
              </Button>
            </Link>
            {isPublished ? (
              <Button 
                variant="outline" 
                className="flex items-center gap-2 text-yellow-600 border-yellow-300 hover:bg-yellow-50"
              >
                <Pause className="h-4 w-4" />
                Unpublish
              </Button>
            ) : (
              <Button 
                className="flex items-center gap-2"
                style={brandingStyles.primaryButton}
              >
                <Play className="h-4 w-4" />
                Publish Site
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Site Overview */}
      <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Site Overview</h2>
          <div className="flex gap-2">
            <Link href={getPageUrl('landing')} target="_blank" rel="noopener noreferrer">
              <button 
                className="inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium transition-colors text-white"
                style={brandingStyles.primaryButton}
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                View Live
              </button>
            </Link>
            <Link href="/creator/white-label-sites/templates">
              <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 text-sm">
                <Palette className="h-4 w-4 mr-1" />
                Change Template
              </button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">Total Pages</h3>
              <Globe className="h-5 w-5 text-gray-500" />
            </div>
            <p className="text-2xl font-bold" style={{ color: branding.brandColor }}>
              {whiteLabeledPages.length}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">Published</h3>
              <Play className="h-5 w-5 text-gray-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">
              {whiteLabeledPages.filter(page => page.active).length}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium text-gray-900">Template</h3>
              <LayoutTemplate className="h-5 w-5 text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-900">
              Modern SaaS
            </p>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="font-medium text-gray-900 mb-3">Individual Pages</h3>
          <div className="grid gap-4">
            {whiteLabeledPages.map((page: WhiteLabeledPage) => {
              const pageTyped = page as any;
              return (
              <div key={pageTyped.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${pageTyped.active ? 'bg-green-500' : 'bg-yellow-500'}`} />
                  <div>
                    <h4 className="font-medium text-gray-900">{pageTyped.page_title || pageTyped.page_slug}</h4>
                    <p className="text-sm text-gray-600">
                      {pageTyped.page_slug === 'landing' ? 'Home Page' : `${pageTyped.page_title || pageTyped.page_slug} Page`}
                      {!pageTyped.active && ' (Draft)'}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={getPreviewUrl(pageTyped.page_slug)} target="_blank" rel="noopener noreferrer">
                    <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 text-sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </button>
                  </Link>
                  <Link href="/creator/storefront/customize">
                    <button className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 text-sm">
                      <Settings className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                  </Link>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 text-sm">
        <h3 className="font-medium text-blue-900 mb-2">💡 Pro Tip:</h3>
        <p>
          Your white-labeled pages automatically use your branding, extracted website data, and product information.
          Try different templates to see which style works best for your brand!
        </p>
      </div>
    </div>
  );
}