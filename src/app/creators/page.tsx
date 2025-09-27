import { Suspense } from 'react';
import { Metadata } from 'next';

import { CreatorDirectory } from '@/features/creator/components/creator-directory';

export const metadata: Metadata = {
  title: 'Creator Directory - Discover Amazing SaaS Creators | SaaSinaSnap',
  description: 'Browse our curated directory of innovative SaaS creators and their products. Find solutions, compare offerings, and connect with the best creators in the industry.',
  keywords: 'saas creators, directory, software solutions, saas products, creator marketplace, indie hackers, startup directory',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://saasinasnap.com'}/creators`,
    siteName: 'SaaSinaSnap',
    title: 'Creator Directory - Discover Amazing SaaS Creators',
    description: 'Browse our curated directory of innovative SaaS creators and their products.',
    images: [
      {
        url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://saasinasnap.com'}/og-creator-directory.png`,
        width: 1200,
        height: 630,
        alt: 'SaaSinaSnap Creator Directory',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Creator Directory - Discover Amazing SaaS Creators',
    description: 'Browse our curated directory of innovative SaaS creators and their products.',
    images: [`${process.env.NEXT_PUBLIC_SITE_URL || 'https://saasinasnap.com'}/og-creator-directory.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function CreatorsDirectoryPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: 'Creator Directory',
            description: 'Browse our curated directory of innovative SaaS creators and their products.',
            url: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://saasinasnap.com'}/creators`,
            mainEntity: {
              '@type': 'ItemList',
              name: 'SaaS Creators Directory',
              description: 'A curated list of innovative SaaS creators and their products',
            },
            breadcrumb: {
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'Home',
                  item: process.env.NEXT_PUBLIC_SITE_URL || 'https://saasinasnap.com',
                },
                {
                  '@type': 'ListItem',
                  position: 2,
                  name: 'Creator Directory',
                  item: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://saasinasnap.com'}/creators`,
                },
              ],
            },
          }),
        }}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-6">
            Creator Directory
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Discover amazing SaaS creators and their innovative products. Browse, search, and connect with the most talented builders in the industry.
          </p>
          
          {/* Quick stats */}
          <div className="flex justify-center gap-8 text-sm text-gray-500 mb-8">
            <div>
              <span className="font-semibold text-blue-600">500+</span> Creators
            </div>
            <div>
              <span className="font-semibold text-purple-600">1000+</span> Products
            </div>
            <div>
              <span className="font-semibold text-indigo-600">50+</span> Categories
            </div>
          </div>
        </div>

        {/* Creator Directory Component */}
        <Suspense fallback={
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        }>
          <CreatorDirectory />
        </Suspense>
      </div>
    </div>
  );
}