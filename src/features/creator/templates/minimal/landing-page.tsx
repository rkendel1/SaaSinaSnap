import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { type CreatorBranding, getBrandingStyles, getTemplateSpecificStyles } from '@/utils/branding-utils';

import { createCreatorCheckoutAction } from '../../actions/create-creator-checkout-action';
import { CreatorProductCard } from '../../components/creator-product-card';
import { CreatorProduct } from '../../types';
import { PageTemplateProps } from '../types';

export function MinimalLandingPage({ creator, products, pageConfig }: PageTemplateProps) {
  // Create branding object from creator profile
  const branding: CreatorBranding = {
    brandColor: creator.brand_color || '#ea580c',
    brandGradient: creator.brand_gradient,
    brandPattern: creator.brand_pattern,
  };
  
  const brandingStyles = getBrandingStyles(branding);
  const minimalStyles = getTemplateSpecificStyles(branding, 'minimal');
  
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 py-8 border-b border-gray-100">
        <div className="mx-auto max-w-4xl flex items-center justify-between">
          {creator.business_logo_url ? (
            <Image
              src={creator.business_logo_url}
              alt={creator.business_name || 'Business Logo'}
              className="h-8 w-auto"
            />
          ) : (
            <div 
              className="text-xl font-semibold" 
              style={{ color: branding.brandColor }}
            >
              {creator.business_name || 'SaaSinaSnap'}
            </div>
          )}
          
          <nav className="hidden md:flex items-center gap-8 text-sm">
            <Link 
              href={`/c/${creator.page_slug}/pricing`}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Pricing
            </Link>
            <Link 
              href={`/c/${creator.page_slug}/account`}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Account
            </Link>
            <Button 
              size="sm"
              className="ml-4"
              style={minimalStyles.cleanButton}
              asChild
            >
              <Link href={`/c/${creator.page_slug}/pricing`}>
                Get Started
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-light text-gray-900 mb-6 leading-tight">
            {pageConfig.heroTitle || `Welcome to ${creator.business_name || 'SaaSinaSnap'}`}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-12 leading-relaxed">
            {pageConfig.heroSubtitle || creator.business_description || 'SaaS in a Snap - Launch your business with amazing speed and efficiency'}
          </p>
          
          <Button 
            size="lg" 
            className="px-12 py-3 text-base"
            style={minimalStyles.cleanButton}
            asChild
          >
            <Link href={`/c/${creator.page_slug}/pricing`}>
              {pageConfig.ctaText || 'Get Started'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-16 bg-gray-50">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-light text-gray-900 text-center mb-16">
            Everything you need, nothing you don&apos;t
          </h2>
          
          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                title: 'Simple',
                description: 'Clean, intuitive interface that just works'
              },
              {
                title: 'Fast',
                description: 'Lightning-fast performance out of the box'
              },
              {
                title: 'Reliable',
                description: 'Built to scale with your growing business'
              }
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div 
                  className="w-1 h-8 mx-auto mb-6"
                  style={minimalStyles.subtleAccent}
                />
                <h3 className="text-lg font-medium text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      {pageConfig.showPricing && products.length > 0 && (
        <section className="px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-2xl font-light text-gray-900 text-center mb-16">
              Simple, transparent pricing
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product: CreatorProduct) => (
                <div key={product.id} style={minimalStyles.minimalistCard}>
                  <CreatorProductCard
                    product={product}
                    creator={creator}
                    createCheckoutAction={createCreatorCheckoutAction}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      {pageConfig.showTestimonials && (
        <section className="px-6 py-16 bg-gray-50">
          <div className="mx-auto max-w-4xl text-center">
            <div className="space-y-8">
              <blockquote className="text-xl text-gray-600 font-light leading-relaxed">
                &ldquo;Simple, elegant, and exactly what we needed to get started quickly.&rdquo;
              </blockquote>
              <div className="flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" style={{ color: branding.brandColor }} />
                ))}
              </div>
              <p className="text-sm text-gray-500">Customer testimonial</p>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-2xl font-light text-gray-900 mb-6">
            Ready to get started?
          </h2>
          <p className="text-gray-600 mb-8">
            Join us today and see the difference simplicity makes.
          </p>
          <Button 
            size="lg" 
            className="px-12 py-3"
            style={minimalStyles.cleanButton}
            asChild
          >
            <Link href={`/c/${creator.page_slug}/pricing`}>
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-12">
        <div className="mx-auto max-w-4xl text-center">
          <div 
            className="text-lg font-medium mb-4" 
            style={{ color: branding.brandColor }}
          >
            {creator.business_name || 'SaaSinaSnap'}
          </div>
          <p className="text-sm text-gray-600 mb-6">
            {creator.business_description || 'SaaS in a Snap - Launch your business with amazing speed and efficiency'}
          </p>
          <div className="flex justify-center gap-8 text-sm">
            <Link 
              href={`/c/${creator.page_slug}/pricing`}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Pricing
            </Link>
            <Link 
              href={`/c/${creator.page_slug}/account`}
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Account
            </Link>
          </div>
          <div className="border-t border-gray-100 mt-8 pt-8 text-xs text-gray-500">
            <p>&copy; 2024 {creator.business_name || 'SaaSinaSnap'}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}