import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, Shield, Users, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { type CreatorBranding, getBrandingStyles, getTemplateSpecificStyles } from '@/utils/branding-utils';

import { createCreatorCheckoutAction } from '../../actions/create-creator-checkout-action';
import { CreatorProduct } from '../../types';
import { CreatorProductCard } from '../../components/creator-product-card';
import { PageTemplateProps } from '../types';

export function ClassicLandingPage({ creator, products, pageConfig }: PageTemplateProps) {
  // Create branding object from creator profile
  const branding: CreatorBranding = {
    brandColor: creator.brand_color || '#ea580c',
    brandGradient: creator.brand_gradient,
    brandPattern: creator.brand_pattern,
  };
  
  const brandingStyles = getBrandingStyles(branding);
  const classicStyles = getTemplateSpecificStyles(branding, 'classic');
  
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 py-4" style={classicStyles.classicHeader}>
        <div className="mx-auto max-w-6xl flex items-center justify-between">
          {creator.business_logo_url ? (
            <Image
              src={creator.business_logo_url}
              alt={creator.business_name || 'Business Logo'}
              className="h-10 w-auto filter brightness-0 invert"
            />
          ) : (
            <div className="text-2xl font-bold text-white">
              {creator.business_name || 'SaaSinaSnap'}
            </div>
          )}
          
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href={`/c/${creator.page_slug}/pricing`}
              className="text-white/90 hover:text-white font-medium transition-colors"
            >
              Pricing
            </Link>
            <Link 
              href={`/c/${creator.page_slug}/account`}
              className="text-white/90 hover:text-white font-medium transition-colors"
            >
              Account
            </Link>
            <Button 
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-current ml-4"
              style={{ borderColor: 'white' }}
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
      <section className="px-6 py-16 bg-gray-50">
        <div className="mx-auto max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                {pageConfig.heroTitle || `Welcome to ${creator.business_name || 'SaaSinaSnap'}`}
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                {pageConfig.heroSubtitle || creator.business_description || 'SaaS in a Snap - Launch your business with amazing speed and efficiency'}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-4"
                  style={classicStyles.traditionalButton}
                  asChild
                >
                  <Link href={`/c/${creator.page_slug}/pricing`}>
                    {pageConfig.ctaText || 'Get Started'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 py-4"
                >
                  Learn More
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div 
                className="aspect-video rounded-lg shadow-xl flex items-center justify-center text-gray-400 text-xl font-medium"
                style={{ backgroundColor: '#f8fafc' }}
              >
                Product Demo
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Choose {creator.business_name || 'SaaSinaSnap'}?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional-grade features designed to help your business succeed
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <Shield className="h-8 w-8" />,
                title: 'Enterprise Security',
                description: 'Bank-level security with end-to-end encryption and compliance certifications'
              },
              {
                icon: <Zap className="h-8 w-8" />,
                title: 'High Performance',
                description: '99.9% uptime guarantee with lightning-fast response times worldwide'
              },
              {
                icon: <Users className="h-8 w-8" />,
                title: '24/7 Support',
                description: 'Expert support team available around the clock to help you succeed'
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="p-8 text-center"
                style={classicStyles.businessCard}
              >
                <div 
                  className="inline-flex p-4 rounded-full mb-6"
                  style={{ backgroundColor: `${branding.brandColor}20`, color: branding.brandColor }}
                >
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6 py-16 bg-gray-50">
        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { number: '10,000+', label: 'Happy Customers' },
              { number: '99.9%', label: 'Uptime' },
              { number: '24/7', label: 'Support' },
              { number: '50+', label: 'Countries' }
            ].map((stat, index) => (
              <div key={index}>
                <div 
                  className="text-3xl font-bold mb-2"
                  style={{ color: branding.brandColor }}
                >
                  {stat.number}
                </div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      {pageConfig.showPricing && products.length > 0 && (
        <section className="px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
                Choose Your Plan
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Flexible pricing options designed to grow with your business
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product: CreatorProduct) => (
                <div key={product.id} style={classicStyles.businessCard}>
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
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
              What Our Customers Say
            </h2>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  quote: "Outstanding service and reliability. This platform has transformed our business operations.",
                  author: "Sarah Johnson",
                  title: "CEO, TechCorp"
                },
                {
                  quote: "The best investment we've made. Professional, efficient, and always available when we need them.",
                  author: "Michael Chen",
                  title: "Founder, StartupXYZ"
                },
                {
                  quote: "Exceptional quality and support. Would recommend to any business looking to scale.",
                  author: "Emily Davis",
                  title: "Director, GlobalInc"
                }
              ].map((testimonial, index) => (
                <div 
                  key={index}
                  className="p-6"
                  style={classicStyles.businessCard}
                >
                  <p className="text-gray-600 mb-4 leading-relaxed">
                    &ldquo;{testimonial.quote}&rdquo;
                  </p>
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-600">{testimonial.title}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="px-6 py-16" style={classicStyles.classicHeader}>
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of businesses that trust us with their success
          </p>
          <Button 
            size="lg" 
            variant="outline"
            className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-current"
            style={{ borderColor: 'white' }}
            asChild
          >
            <Link href={`/c/${creator.page_slug}/pricing`}>
              Start Your Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="text-2xl font-bold mb-4">
                {creator.business_name || 'SaaSinaSnap'}
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                {creator.business_description || 'SaaS in a Snap - Launch your business with amazing speed and efficiency'}
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href={`/c/${creator.page_slug}/pricing`} className="hover:text-white transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href={`/c/${creator.page_slug}/account`} className="hover:text-white transition-colors">
                    Account
                  </Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">Help Center</a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">Contact Us</a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            <p>&copy; 2024 {creator.business_name || 'SaaSinaSnap'}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}