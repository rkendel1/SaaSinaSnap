import Link from 'next/link';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { CreatorProductCard } from './creator-product-card';
import { createCreatorCheckoutAction } from '../actions/create-creator-checkout-action';
import { CreatorProfile, CreatorProduct, WhiteLabeledPage } from '../types';

interface CreatorLandingPageProps {
  creator: CreatorProfile;
  products: CreatorProduct[];
  pageConfig: WhiteLabeledPage;
}

export function CreatorLandingPage({ creator, products, pageConfig }: CreatorLandingPageProps) {
  const brandColor = creator.brand_color || '#3b82f6';
  
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-4 py-6 lg:px-6">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          {creator.business_logo_url ? (
            <Image
              src={creator.business_logo_url}
              alt={creator.business_name || 'Business Logo'}
              width={160}
              height={40}
              className="h-10 w-auto"
            />
          ) : (
            <div className="text-2xl font-bold" style={{ color: brandColor }}>
              {creator.business_name || 'SaaS Platform'}
            </div>
          )}
          
          <nav className="flex items-center gap-6">
            <Link 
              href={`/c/${creator.custom_domain}/pricing`}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              Pricing
            </Link>
            <Button 
              variant="default" 
              style={{ backgroundColor: brandColor }}
              asChild
            >
              <Link href={`/c/${creator.custom_domain}/pricing`}>
                {pageConfig.ctaText}
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-16 lg:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-6">
            {pageConfig.heroTitle}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            {pageConfig.heroSubtitle}
          </p>
          <Button 
            size="lg"
            style={{ backgroundColor: brandColor }}
            asChild
          >
            <Link href={`/c/${creator.custom_domain}/pricing`}>
              {pageConfig.ctaText}
            </Link>
          </Button>
        </div>
      </section>

      {/* Products Section */}
      {pageConfig.showPricing && products.length > 0 && (
        <section className="px-4 py-16 lg:px-6 bg-gray-50">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Choose Your Plan
              </h2>
              <p className="text-xl text-gray-600">
                Find the perfect plan for your needs
              </p>
            </div>
            
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
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {pageConfig.showTestimonials && (
        <section className="px-4 py-16 lg:px-6">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-12">
              What Our Customers Say
            </h2>
            <div className="bg-gray-50 rounded-lg p-8">
              <blockquote className="text-lg italic text-gray-700 mb-4">
                "This platform has transformed how we deliver our SaaS products. 
                The experience is seamless and our customers love it!"
              </blockquote>
              <cite className="font-semibold text-gray-900">
                - Satisfied Customer
              </cite>
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {pageConfig.showFaq && (
        <section className="px-4 py-16 lg:px-6 bg-gray-50">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Frequently Asked Questions
            </h2>
            <div className="space-y-6">
              <div className="bg-white rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  How do I get started?
                </h3>
                <p className="text-gray-600">
                  Simply choose a plan above and follow the checkout process. You'll have access immediately.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Can I change plans later?
                </h3>
                <p className="text-gray-600">
                  Yes, you can upgrade or downgrade your plan at any time from your account dashboard.
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

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