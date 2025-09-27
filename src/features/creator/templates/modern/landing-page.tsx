'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Star } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { type CreatorBranding, getBrandingStyles, getTemplateSpecificStyles } from '@/utils/branding-utils';

import { createCreatorCheckoutAction } from '../../actions/create-creator-checkout-action';
import { CreatorProductCard } from '../../components/creator-product-card';
import { CreatorProduct } from '../../types';
import { PageTemplateProps } from '../types';

export function ModernLandingPage({ creator, products, pageConfig }: PageTemplateProps) {
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
          {creator.business_logo_url ? (
            <Image
              src={creator.business_logo_url}
              alt={creator.business_name || 'Business Logo'}
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
          
          <nav className="hidden md:flex items-center gap-8">
            <Link 
              href={`/c/${creator.page_slug}/pricing`}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors relative group"
            >
              <span>Pricing</span>
              <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-transparent group-hover:w-full transition-all duration-300" style={brandingStyles.gradientBackground} />
            </Link>
            <Link 
              href={`/c/${creator.page_slug}/account`}
              className="text-gray-600 hover:text-gray-900 font-medium transition-colors relative group"
            >
              <span>Account</span>
              <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-transparent group-hover:w-full transition-all duration-300" style={brandingStyles.gradientBackground} />
            </Link>
          </nav>
          
          <Button 
            variant="default" 
            className="transition-all duration-300 hover:scale-105 hover:shadow-lg"
            style={modernStyles.heroGradient}
            asChild
          >
            <Link href={`/c/${creator.page_slug}/pricing`}>
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-4 py-20 lg:px-6 lg:py-32">
        <div className="mx-auto max-w-6xl text-center">
          {/* Floating elements animation */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div 
              className="absolute top-20 left-10 w-20 h-20 rounded-full opacity-20 animate-bounce"
              style={{ backgroundColor: branding.brandColor, animationDelay: '0s', animationDuration: '3s' }}
            />
            <div 
              className="absolute top-40 right-20 w-16 h-16 rounded-full opacity-20 animate-bounce"
              style={{ backgroundColor: branding.brandColor, animationDelay: '1s', animationDuration: '4s' }}
            />
            <div 
              className="absolute bottom-40 left-20 w-12 h-12 rounded-full opacity-20 animate-bounce"
              style={{ backgroundColor: branding.brandColor, animationDelay: '2s', animationDuration: '5s' }}
            />
          </div>
          
          <div className="relative z-10">
            <h1 
              className="text-5xl lg:text-6xl font-bold mb-6 animate-fade-in-up"
              style={brandingStyles.gradientText}
            >
              {pageConfig.heroTitle || `Welcome to ${creator.business_name || 'SaaSinaSnap'}`}
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 max-w-3xl mx-auto mb-8 animate-fade-in-up animation-delay-200">
              {pageConfig.heroSubtitle || creator.business_description || 'SaaS in a Snap - Launch your business with amazing speed and efficiency'}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-400">
              <Button 
                size="lg" 
                className="text-lg px-8 py-4 transition-all duration-300 hover:scale-105 hover:shadow-xl"
                style={modernStyles.heroGradient}
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
                className="text-lg px-8 py-4 backdrop-blur-sm bg-white/50 border-2 transition-all duration-300 hover:scale-105 hover:bg-white/70"
                style={{ borderColor: branding.brandColor }}
              >
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 
              className="text-3xl lg:text-4xl font-bold mb-4"
              style={brandingStyles.gradientText}
            >
              Why Choose Us?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to launch and scale your business with confidence
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: <CheckCircle className="h-8 w-8" />,
                title: 'Easy Setup',
                description: 'Get started in minutes with our intuitive onboarding process'
              },
              {
                icon: <Star className="h-8 w-8" />,
                title: 'Premium Quality',
                description: 'Professional-grade features and reliability you can trust'
              },
              {
                icon: <ArrowRight className="h-8 w-8" />,
                title: 'Scale Fast',
                description: 'Grow your business without limits with our scalable platform'
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="group p-8 rounded-2xl backdrop-blur-sm bg-white/60 border border-white/20 transition-all duration-300 hover:transform hover:scale-105 hover:bg-white/80 hover:shadow-xl"
                style={modernStyles.cardStyle}
              >
                <div 
                  className="inline-flex p-3 rounded-xl mb-4 transition-all duration-300 group-hover:scale-110"
                  style={brandingStyles.subtleGradientBackground}
                >
                  <div style={{ color: branding.brandColor }}>
                    {feature.icon}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      {pageConfig.showPricing && products.length > 0 && (
        <section className="px-4 py-16 lg:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 
                className="text-3xl lg:text-4xl font-bold mb-4"
                style={brandingStyles.gradientText}
              >
                Choose Your Plan
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Select the perfect plan to fit your needs and budget
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product: CreatorProduct) => (
                <div key={product.id} className="transform transition-all duration-300 hover:scale-105">
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

      {/* CTA Section */}
      <section 
        className="px-4 py-20 lg:px-6"
        style={modernStyles.heroGradient}
      >
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of satisfied customers and transform your business today
          </p>
          <Button 
            size="lg" 
            variant="outline"
            className="text-lg px-8 py-4 bg-white hover:bg-gray-50 transition-all duration-300 hover:scale-105 hover:shadow-xl"
            style={{ borderColor: 'white', color: branding.brandColor }}
            asChild
          >
            <Link href={`/c/${creator.page_slug}/pricing`}>
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/90 backdrop-blur-sm border-t border-white/20 px-4 py-12 lg:px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <div 
              className="text-2xl font-bold mb-4" 
              style={brandingStyles.gradientText}
            >
              {creator.business_name || 'SaaSinaSnap'}
            </div>
            <p className="text-gray-600 mb-6">
              {creator.business_description || 'SaaS in a Snap - Launch your business with amazing speed and efficiency'}
            </p>
            <div className="flex justify-center gap-8">
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
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-gray-600">
            <p>&copy; 2024 {creator.business_name || 'SaaSinaSnap'}. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* CSS Animations */}
      <style jsx>{`
        @keyframes gradientShift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-400 {
          animation-delay: 0.4s;
        }
      `}</style>
    </div>
  );
}