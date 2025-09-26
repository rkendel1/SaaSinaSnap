import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, BarChart3, Building2, Globe2, Lock, TrendingUp, Users2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { type CreatorBranding, getBrandingStyles, getTemplateSpecificStyles } from '@/utils/branding-utils';

import { createCreatorCheckoutAction } from '../../actions/create-creator-checkout-action';
import { CreatorProduct } from '../../types';
import { CreatorProductCard } from '../../components/creator-product-card';
import { PageTemplateProps } from '../types';

export function CorporateLandingPage({ creator, products, pageConfig }: PageTemplateProps) {
  // Create branding object from creator profile
  const branding: CreatorBranding = {
    brandColor: creator.brand_color || '#ea580c',
    brandGradient: creator.brand_gradient,
    brandPattern: creator.brand_pattern,
  };
  
  const brandingStyles = getBrandingStyles(branding);
  const corporateStyles = getTemplateSpecificStyles(branding, 'corporate');
  
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 py-4" style={corporateStyles.professionalHeader}>
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-8">
            {creator.business_logo_url ? (
              <Image
                src={creator.business_logo_url}
                alt={creator.business_name || 'Business Logo'}
                className="h-10 w-auto"
              />
            ) : (
              <div 
                className="text-2xl font-bold" 
                style={{ color: branding.brandColor }}
              >
                {creator.business_name || 'SaaSinaSnap'}
              </div>
            )}
          </div>
          
          <nav className="hidden lg:flex items-center gap-8">
            <Link 
              href={`/c/${creator.page_slug}`}
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Solutions
            </Link>
            <Link 
              href={`/c/${creator.page_slug}/pricing`}
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Pricing
            </Link>
            <Link 
              href={`/c/${creator.page_slug}/account`}
              className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
            >
              Resources
            </Link>
            <Button 
              className="ml-4"
              style={corporateStyles.corporateButton}
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
      <section className="px-6 py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                <Building2 className="h-4 w-4" />
                Enterprise Ready
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                {pageConfig.heroTitle || `Enterprise Solutions for ${creator.business_name || 'Modern Businesses'}`}
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed max-w-xl">
                {pageConfig.heroSubtitle || creator.business_description || 'Scalable, secure, and compliant solutions designed for enterprise needs'}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Button 
                  size="lg" 
                  className="text-lg px-8 py-4"
                  style={corporateStyles.corporateButton}
                  asChild
                >
                  <Link href={`/c/${creator.page_slug}/pricing`}>
                    {pageConfig.ctaText || 'Request Demo'}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="text-lg px-8 py-4"
                >
                  View Case Studies
                </Button>
              </div>
              
              {/* Trust Indicators */}
              <div className="flex items-center gap-8 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  SOC2 Compliant
                </div>
                <div className="flex items-center gap-2">
                  <Globe2 className="h-4 w-4" />
                  99.99% Uptime
                </div>
                <div className="flex items-center gap-2">
                  <Users2 className="h-4 w-4" />
                  500+ Enterprises
                </div>
              </div>
            </div>
            
            <div className="relative">
              <div 
                className="aspect-[4/3] rounded-xl shadow-2xl flex items-center justify-center text-gray-400 text-2xl font-medium border"
                style={{ backgroundColor: '#f8fafc' }}
              >
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4" />
                  Enterprise Dashboard
                </div>
              </div>
              
              {/* Floating stats */}
              <div 
                className="absolute -bottom-6 -left-6 bg-white rounded-lg shadow-lg p-4 border"
                style={corporateStyles.enterpriseCard}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: branding.brandColor }}
                  />
                  <div>
                    <div className="text-2xl font-bold text-gray-900">2.4M+</div>
                    <div className="text-sm text-gray-600">Records Processed</div>
                  </div>
                </div>
              </div>
              
              <div 
                className="absolute -top-6 -right-6 bg-white rounded-lg shadow-lg p-4 border"
                style={corporateStyles.enterpriseCard}
              >
                <TrendingUp className="h-8 w-8 mb-2" style={{ color: branding.brandColor }} />
                <div className="text-lg font-bold text-gray-900">↑ 340%</div>
                <div className="text-xs text-gray-600">Efficiency Gain</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Logo Strip */}
      <section className="px-6 py-12 bg-white border-y border-gray-200">
        <div className="mx-auto max-w-7xl">
          <p className="text-center text-gray-600 mb-8 font-medium">
            Trusted by leading enterprises worldwide
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 items-center opacity-60">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i}
                className="h-12 bg-gray-200 rounded flex items-center justify-center text-gray-500 font-medium"
              >
                Logo {i + 1}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
              Enterprise-Grade Capabilities
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built for scale, security, and compliance with the features enterprises demand
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <Lock className="h-8 w-8" />,
                title: 'Advanced Security',
                description: 'End-to-end encryption, SSO integration, and comprehensive audit logs'
              },
              {
                icon: <BarChart3 className="h-8 w-8" />,
                title: 'Analytics & Insights',
                description: 'Real-time dashboards and business intelligence for data-driven decisions'
              },
              {
                icon: <Users2 className="h-8 w-8" />,
                title: 'Team Collaboration',
                description: 'Advanced permission controls and collaborative workspaces'
              },
              {
                icon: <Globe2 className="h-8 w-8" />,
                title: 'Global Scale',
                description: 'Multi-region deployment with 99.99% uptime guarantee'
              },
              {
                icon: <Building2 className="h-8 w-8" />,
                title: 'Enterprise Integration',
                description: 'Seamless integration with existing enterprise systems and workflows'
              },
              {
                icon: <TrendingUp className="h-8 w-8" />,
                title: 'Performance Optimization',
                description: 'Automated scaling and performance monitoring for peak efficiency'
              }
            ].map((feature, index) => (
              <div 
                key={index}
                className="p-8"
                style={corporateStyles.enterpriseCard}
              >
                <div 
                  className="inline-flex p-3 rounded-lg mb-6"
                  style={{ backgroundColor: `${branding.brandColor}15`, color: branding.brandColor }}
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
      <section className="px-6 py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-16">
            Proven Results at Enterprise Scale
          </h2>
          
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { number: '500+', label: 'Enterprise Clients', sublabel: 'Fortune 500 companies' },
              { number: '99.99%', label: 'Uptime SLA', sublabel: 'Industry-leading reliability' },
              { number: '10B+', label: 'Records Processed', sublabel: 'Daily transaction volume' },
              { number: '<100ms', label: 'Response Time', sublabel: 'Global average latency' }
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div 
                  className="text-4xl lg:text-5xl font-bold mb-2"
                  style={{ color: branding.brandColor }}
                >
                  {stat.number}
                </div>
                <div className="text-lg font-semibold text-gray-900 mb-1">{stat.label}</div>
                <div className="text-sm text-gray-600">{stat.sublabel}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      {pageConfig.showPricing && products.length > 0 && (
        <section className="px-6 py-20">
          <div className="mx-auto max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Enterprise Pricing Plans
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Flexible pricing options designed to scale with your enterprise needs
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {products.map((product: CreatorProduct) => (
                <div key={product.id} style={corporateStyles.enterpriseCard}>
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
      <section className="px-6 py-20" style={{ backgroundColor: branding.brandColor }}>
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Enterprise?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join hundreds of enterprises that have revolutionized their operations with our platform
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-current"
              style={{ borderColor: 'white' }}
              asChild
            >
              <Link href={`/c/${creator.page_slug}/pricing`}>
                Schedule Demo
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline"
              className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-current"
              style={{ borderColor: 'white' }}
            >
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white px-6 py-16">
        <div className="mx-auto max-w-7xl">
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-2">
              <div className="text-2xl font-bold mb-4">
                {creator.business_name || 'SaaSinaSnap'}
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                {creator.business_description || 'Enterprise-grade solutions for modern businesses'}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  SOC2 Type II
                </div>
                <div className="flex items-center gap-2">
                  <Globe2 className="h-4 w-4" />
                  ISO 27001
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Solutions</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Enterprise</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Mid-Market</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Small Business</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Case Studies</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-3 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Sales</a></li>
                <li><a href="#" className="hover:text-white transition-colors">System Status</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-gray-400">
            <p>&copy; 2024 {creator.business_name || 'SaaSinaSnap'}. All rights reserved.</p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-white transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}