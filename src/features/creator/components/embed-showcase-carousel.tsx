'use client';

import { BarChart3, CreditCard, Globe, Sparkles, Users, Zap } from 'lucide-react';

import { Carousel } from '@/components/ui/carousel';

interface EmbedShowcaseCarouselProps {
  brandColor: string;
}

export function EmbedShowcaseCarousel({ brandColor }: EmbedShowcaseCarouselProps) {
  const embedFeatures = [
    {
      id: 'pricing-cards',
      icon: <CreditCard className="h-6 w-6" />,
      title: 'Dynamic Pricing Cards',
      description: 'Beautiful, responsive pricing cards that adapt to your brand colors and convert visitors into customers.',
      preview: (
        <div className="bg-white rounded-lg border p-6 min-h-[200px] flex flex-col justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold mb-2" style={{ color: brandColor }}>
              Pro Plan
            </div>
            <div className="text-3xl font-bold mb-4">$29<span className="text-sm text-gray-500">/month</span></div>
            <div 
              className="inline-block px-6 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: brandColor }}
            >
              Get Started
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'checkout-buttons',
      icon: <Zap className="h-6 w-6" />,
      title: 'Smart Checkout Buttons',
      description: 'One-click checkout buttons that integrate seamlessly with Stripe for instant purchases.',
      preview: (
        <div className="bg-white rounded-lg border p-6 min-h-[200px] flex flex-col justify-center">
          <div className="text-center">
            <div className="mb-4">
              <div className="text-lg font-semibold mb-2">Premium Features</div>
              <div className="text-gray-600 text-sm">Unlock advanced capabilities</div>
            </div>
            <div 
              className="inline-block px-8 py-3 rounded-lg text-white font-medium text-lg"
              style={{ backgroundColor: brandColor }}
            >
              Buy Now - $99
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'user-profiles',
      icon: <Users className="h-6 w-6" />,
      title: 'User Profile Cards',
      description: 'Showcase your team or customer testimonials with elegant profile cards.',
      preview: (
        <div className="bg-white rounded-lg border p-6 min-h-[200px] flex flex-col justify-center">
          <div className="flex items-center space-x-4">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: brandColor }}
            >
              JD
            </div>
            <div>
              <div className="font-semibold">John Doe</div>
              <div className="text-gray-600 text-sm">CEO, Tech Company</div>
              <div className="text-gray-500 text-sm mt-1">"This platform transformed our business!"</div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'analytics-widgets',
      icon: <BarChart3 className="h-6 w-6" />,
      title: 'Analytics Widgets',
      description: 'Display key metrics and performance data with beautiful, interactive charts.',
      preview: (
        <div className="bg-white rounded-lg border p-6 min-h-[200px] flex flex-col justify-center">
          <div className="text-center">
            <div className="text-sm text-gray-600 mb-4">Monthly Revenue</div>
            <div className="text-3xl font-bold mb-4" style={{ color: brandColor }}>
              $12,450
            </div>
            <div className="flex justify-center space-x-2">
              {[40, 65, 45, 80, 60, 90, 75].map((height, i) => (
                <div
                  key={i}
                  className="w-3 rounded-t"
                  style={{ 
                    height: `${height}px`, 
                    backgroundColor: brandColor,
                    opacity: 0.7 + (i * 0.05)
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'brand-headers',
      icon: <Globe className="h-6 w-6" />,
      title: 'Branded Headers',
      description: 'Professional headers that maintain your brand identity across all embedded content.',
      preview: (
        <div className="bg-white rounded-lg border overflow-hidden min-h-[200px] flex flex-col justify-center">
          <div 
            className="p-4 text-white"
            style={{ 
              background: `linear-gradient(45deg, ${brandColor}, ${brandColor}CC)` 
            }}
          >
            <div className="font-bold text-lg">Your Brand</div>
            <div className="text-sm opacity-90">Professional • Consistent • Engaging</div>
          </div>
          <div className="p-4">
            <div className="text-gray-600 text-sm">
              This header adapts to your brand colors and maintains consistency across all embeds.
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'feature-highlights',
      icon: <Sparkles className="h-6 w-6" />,
      title: 'Feature Highlights',
      description: 'Showcase your product features with engaging, interactive highlight cards.',
      preview: (
        <div className="bg-white rounded-lg border p-6 min-h-[200px] flex flex-col justify-center">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: brandColor }}
              />
              <div className="text-sm">Advanced Analytics Dashboard</div>
            </div>
            <div className="flex items-center space-x-3">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: brandColor }}
              />
              <div className="text-sm">Real-time Collaboration Tools</div>
            </div>
            <div className="flex items-center space-x-3">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: brandColor }}
              />
              <div className="text-sm">Enterprise-grade Security</div>
            </div>
          </div>
        </div>
      )
    }
  ];

  const carouselItems = embedFeatures.map(feature => ({
    id: feature.id,
    content: (
      <div className="grid lg:grid-cols-2 gap-8 items-center">
        <div>
          <div className="flex items-center mb-4">
            <div 
              className="p-2 rounded-lg mr-3"
              style={{ backgroundColor: `${brandColor}20`, color: brandColor }}
            >
              {feature.icon}
            </div>
            <h3 className="text-2xl font-bold text-gray-900">{feature.title}</h3>
          </div>
          <p className="text-gray-600 mb-6 text-lg leading-relaxed">
            {feature.description}
          </p>
          <div 
            className="inline-flex items-center text-sm font-medium"
            style={{ color: brandColor }}
          >
            Learn more about embedding →
          </div>
        </div>
        <div className="flex justify-center">
          {feature.preview}
        </div>
      </div>
    )
  }));

  return (
    <section className="px-4 py-16 lg:px-6 bg-gray-50">
      <div className="mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Powerful Embeds That Convert
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Showcase your products and services with beautiful, branded embeds that seamlessly integrate into any website.
          </p>
        </div>
        
        <Carousel 
          items={carouselItems}
          autoPlay={true}
          interval={6000}
          className="bg-white rounded-xl p-8 shadow-sm border"
        />
      </div>
    </section>
  );
}