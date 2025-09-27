'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Star, Zap } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type CreatorBranding, getBrandingStyles, getTemplateSpecificStyles } from '@/utils/branding-utils';

import { createCreatorCheckoutAction } from '../../actions/create-creator-checkout-action';
import { CreatorProductCard } from '../../components/creator-product-card';
import { PageTemplateProps } from '../types';

export function ModernPricingPage({ creator, products, pageConfig }: PageTemplateProps) {
  // Create branding object from creator profile
  const branding: CreatorBranding = {
    brandColor: creator.brand_color || '#ea580c',
    brandGradient: creator.brand_gradient,
    brandPattern: creator.brand_pattern,
  };
  
  const brandingStyles = getBrandingStyles(branding);
  const modernStyles = getTemplateSpecificStyles(branding, 'modern');
  
  return (
    <div className="min-h-screen bg-white" style={brandingStyles.cssVariables}>
      {/* Animated Background */}
      <div 
        className="fixed inset-0 -z-10"
        style={{
          background: `linear-gradient(135deg, ${branding.brandColor}05, ${branding.brandColor}15, ${branding.brandColor}08)`,
          backgroundSize: '400% 400%',
          animation: 'gradientShift 15s ease infinite',
        }}
      />
      
      {/* Header */}
      <header className="relative backdrop-blur-sm bg-white/80 border-b border-white/20 px-4 py-6 lg:px-6">
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          <Link href={`/c/${creator.page_slug}`}>
            {creator.business_logo_url ? (
              <Image
                src={creator.business_logo_url}
                alt={creator.business_name || 'Business Logo'}
                width={40}
                height={40}
                className="h-10 w-auto transition-transform hover:scale-105"
              />
            ) : (
              <div 
                className="text-2xl font-bold transition-transform hover:scale-105" 
                style={brandingStyles.gradientText}
              >
                {creator.business_name || 'SaaSinaSnap'}
              </div>
            )}
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link 
              href={`/c/${creator.page_slug}`}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Home
            </Link>
            <Link 
              href={`/c/${creator.page_slug}/pricing`}
              className="text-gray-900 font-semibold"
              style={brandingStyles.accent}
            >
              Pricing
            </Link>
            <Link 
              href={`/c/${creator.page_slug}/account`}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Account
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 py-16 lg:px-6 lg:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h1 
            className="text-5xl font-bold mb-6 lg:text-6xl"
            style={brandingStyles.gradientText}
          >
            {pageConfig.heroTitle || 'Choose Your Plan'}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {pageConfig.heroSubtitle || 'Select the perfect plan for your needs. Upgrade or downgrade at any time.'}
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 pb-16 lg:px-6 lg:pb-24">
        <div className="mx-auto max-w-6xl">
          {products.length > 0 ? (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product, index) => (
                <Card key={product.id} className={`relative border-2 transition-all duration-300 hover:shadow-xl ${
                  index === 1 ? 'border-2 scale-105' : 'border-gray-200 hover:border-gray-300'
                }`}
                style={index === 1 ? { borderColor: branding.brandColor } : {}}>
                  {index === 1 && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge 
                        className="px-4 py-1 text-white font-semibold"
                        style={brandingStyles.primaryButton}
                      >
                        <Star className="w-3 h-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl font-bold">
                      {product.name}
                    </CardTitle>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-gray-900">
                        ${product.price}
                      </span>
                      <span className="text-gray-600">/{product.billing_interval || 'month'}</span>
                    </div>
                    {product.description && (
                      <p className="text-gray-600 mt-2">
                        {product.description}
                      </p>
                    )}
                  </CardHeader>
                  
                  <CardContent>
                    <form action={createCreatorCheckoutAction}>
                      <input type="hidden" name="creatorId" value={creator.id} />
                      <input type="hidden" name="productId" value={product.id} />
                      <input type="hidden" name="returnUrl" value={`/c/${creator.page_slug}/success`} />
                      
                      <Button 
                        type="submit"
                        className={`w-full mb-6 ${index === 1 ? '' : 'variant-outline'}`}
                        style={index === 1 ? brandingStyles.primaryButton : brandingStyles.outlineButton}
                        size="lg"
                      >
                        {pageConfig.ctaText || 'Get Started'}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>

                    {/* Feature List */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">10,000 API calls/month</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">5GB storage</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">Email support</span>
                      </div>
                      {index >= 1 && (
                        <>
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span className="text-gray-700">Priority support</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span className="text-gray-700">Advanced analytics</span>
                          </div>
                        </>
                      )}
                      {index >= 2 && (
                        <>
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span className="text-gray-700">Custom integrations</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                            <span className="text-gray-700">Dedicated account manager</span>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                Pricing Plans Coming Soon
              </h3>
              <p className="text-gray-600">
                We're working on creating the perfect pricing plans for you.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* FAQ Section */}
      {pageConfig.showFaq && (
        <section className="px-4 py-16 bg-white/80 backdrop-blur-sm lg:px-6">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-3xl font-bold text-center mb-12" style={brandingStyles.gradientText}>
              Frequently Asked Questions
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="font-semibold text-lg mb-2">Can I change plans anytime?</h3>
                <p className="text-gray-600">Yes, you can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle.</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="font-semibold text-lg mb-2">What payment methods do you accept?</h3>
                <p className="text-gray-600">We accept all major credit cards, PayPal, and bank transfers for annual plans.</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="font-semibold text-lg mb-2">Is there a free trial?</h3>
                <p className="text-gray-600">Yes, we offer a 14-day free trial on all plans. No credit card required to start.</p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <h3 className="font-semibold text-lg mb-2">What happens to my data if I cancel?</h3>
                <p className="text-gray-600">Your data is safely stored for 30 days after cancellation, giving you time to export or reactivate.</p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="px-4 py-16 lg:px-6">
        <div className="mx-auto max-w-4xl text-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border">
            <h2 className="text-3xl font-bold mb-4" style={brandingStyles.gradientText}>
              Ready to get started?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of satisfied customers and experience the difference.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/c/${creator.page_slug}`}>
                <Button size="lg" style={brandingStyles.primaryButton}>
                  <Zap className="mr-2 h-5 w-5" />
                  Start Free Trial
                </Button>
              </Link>
              <Button variant="outline" size="lg" style={brandingStyles.outlineButton}>
                Schedule Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-white/20 mt-16">
        <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 {creator.business_name || 'SaaSinaSnap'}. All rights reserved.</p>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
      `}</style>
    </div>
  );
}