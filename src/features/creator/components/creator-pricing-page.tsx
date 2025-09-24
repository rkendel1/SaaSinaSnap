import Link from 'next/link';
import Image from 'next/image';

import { CreatorProductCard } from './creator-product-card';
import { createCreatorCheckoutAction } from '../actions/create-creator-checkout-action';
import { CreatorProfile, CreatorProduct, WhiteLabeledPage } from '../types';
import { getBrandingStyles, type CreatorBranding } from '@/utils/branding-utils';

interface CreatorPricingPageProps {
  creator: CreatorProfile;
  products: CreatorProduct[];
  pageConfig: WhiteLabeledPage;
}

export function CreatorPricingPage({ creator, products, pageConfig }: CreatorPricingPageProps) {
  // Create branding object from creator profile
  const branding: CreatorBranding = {
    brandColor: creator.brand_color || '#3b82f6',
    brandGradient: creator.brand_gradient,
    brandPattern: creator.brand_pattern,
  };
  
  const brandingStyles = getBrandingStyles(branding);
  
  return (
    <div className="min-h-screen bg-white" style={brandingStyles.cssVariables}>
      {/* Header */}
      <header className="px-4 py-6 lg:px-6" style={brandingStyles.subtleGradientBackground}>
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link href={`/c/${creator.custom_domain}`}>
            {creator.business_logo_url ? (
              <Image
                src={creator.business_logo_url}
                alt={creator.business_name || 'Business Logo'}
                width={160}
                height={40}
                className="h-10 w-auto"
              />
            ) : (
              <div 
                className="text-2xl font-bold" 
                style={brandingStyles.gradientText}
              >
                {creator.business_name || 'SaaS Platform'}
              </div>
            )}
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link 
              href={`/c/${creator.custom_domain}`}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
              style={{
                '--tw-text-opacity': '1',
                color: `rgb(${brandingStyles.brandColor} / var(--tw-text-opacity))`,
              }}
            >
              Home
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-16 lg:px-6" style={brandingStyles.gradientBackground}>
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl mb-6">
            Choose Your Plan
          </h1>
          <p className="text-xl text-white/90 mb-8">
            Find the perfect plan that fits your needs and budget
          </p>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="px-4 pb-16 lg:px-6">
        <div className="mx-auto max-w-6xl">
          {products.length > 0 ? (
            <div className="grid gap-6 lg:grid-cols-3">
              {products.map((product) => (
                <CreatorProductCard
                  key={product.id}
                  product={product}
                  creator={creator}
                  createCheckoutAction={createCreatorCheckoutAction}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                No Plans Available
              </h3>
              <p className="text-gray-600 mb-8">
                This creator hasn't set up any pricing plans yet.
              </p>
              <Link 
                href={`/c/${creator.custom_domain}`}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                ← Back to Home
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 py-16 lg:px-6" style={brandingStyles.subtleGradientBackground}>
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12" style={brandingStyles.gradientText}>
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 border" style={brandingStyles.brandBorder}>
              <h3 className="font-semibold text-gray-900 mb-2">
                How do I get started?
              </h3>
              <p className="text-gray-600">
                Simply choose a plan above and follow the checkout process. You&apos;ll have access immediately.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 border" style={brandingStyles.brandBorder}>
              <h3 className="font-semibold text-gray-900 mb-2">
                Can I change plans later?
              </h3>
              <p className="text-gray-600">
                Yes, you can upgrade or downgrade your plan at any time from your account dashboard.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 border" style={brandingStyles.brandBorder}>
              <h3 className="font-semibold text-gray-900 mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-gray-600">
                We accept all major credit cards and debit cards through our secure payment processor.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white px-4 py-8 lg:px-6">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-gray-600">
            © 2024 {creator.business_name || 'SaaS Platform'}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}