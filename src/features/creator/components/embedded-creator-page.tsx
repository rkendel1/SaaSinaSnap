'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { Button } from '@/components/ui/button';

import { createCreatorCheckoutAction } from '../actions/create-creator-checkout-action';
import { CreatorProduct, CreatorProfile, WhiteLabeledPage } from '../types';

import { CreatorProductCard } from './creator-product-card';

interface EmbeddedCreatorPageProps {
  creator: CreatorProfile;
  products: CreatorProduct[];
  pageConfig: WhiteLabeledPage;
}

export function EmbeddedCreatorPage({ creator, products, pageConfig }: EmbeddedCreatorPageProps) {
  const brandColor = creator.brand_color || '#3b82f6';
  
  // Auto-resize iframe functionality
  useEffect(() => {
    const resizeIframe = () => {
      const height = document.documentElement.scrollHeight;
      if (window.parent) {
        window.parent.postMessage({ 
          type: 'resize', 
          height: height 
        }, '*');
      }
    };

    // Initial resize
    resizeIframe();

    // Resize on content changes
    const observer = new ResizeObserver(resizeIframe);
    observer.observe(document.body);

    // Listen for parent iframe height requests
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'getHeight') {
        resizeIframe();
      }
    };

    window.addEventListener('message', handleMessage);
    window.addEventListener('resize', resizeIframe);

    return () => {
      observer.disconnect();
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('resize', resizeIframe);
    };
  }, []);

  return (
    <div className="min-h-screen bg-white embedded-page">
      {/* Embedded-specific styles */}
      <style jsx>{`
        .embedded-page {
          margin: 0;
          padding: 0;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        
        .embedded-page * {
          box-sizing: border-box;
        }
        
        .embedded-page img {
          max-width: 100%;
          height: auto;
        }
        
        .brand-button {
          background-color: ${brandColor};
          transition: all 0.2s ease;
        }
        
        .brand-button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        
        @media (max-width: 768px) {
          .hero-title {
            font-size: 2rem;
          }
          
          .hero-subtitle {
            font-size: 1rem;
          }
        }
      `}</style>

      {/* Header */}
      <header className="px-4 py-6 lg:px-6 border-b border-gray-200">
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
        </div>
      </header>

      {/* Hero Section */}
      <section className="px-4 py-12 lg:px-6 text-center" style={{ 
        background: `linear-gradient(135deg, ${brandColor}15 0%, ${brandColor}05 100%)` 
      }}>
        <div className="mx-auto max-w-4xl">
          <h1 className="hero-title text-4xl lg:text-5xl font-bold mb-6 text-gray-900">
            {pageConfig.heroTitle || `Welcome to ${creator.business_name}`}
          </h1>
          <p className="hero-subtitle text-lg text-gray-600 mb-8 mx-auto max-w-2xl">
            {pageConfig.heroSubtitle || creator.business_description}
          </p>
          <Link 
            href={`/c/${creator.custom_domain || creator.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button 
              className="brand-button text-white px-8 py-3 text-lg font-medium"
              style={{ backgroundColor: brandColor }}
            >
              {pageConfig.ctaText || 'Get Started'}
            </Button>
          </Link>
        </div>
      </section>

      {/* Products Section */}
      {pageConfig.showPricing && products.length > 0 && (
        <section className="px-4 py-12 lg:px-6">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Our Products
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Choose from our range of products designed to help you succeed.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.slice(0, 3).map((product) => (
                <div key={product.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                  <h3 className="text-xl font-bold mb-3 text-gray-900">
                    {product.name}
                  </h3>
                  {product.description && (
                    <p className="text-gray-600 mb-4">
                      {product.description}
                    </p>
                  )}
                  <div className="text-3xl font-bold mb-4" style={{ color: brandColor }}>
                    ${(product.price / 100).toFixed(2)}
                    {product.product_type === 'subscription' && (
                      <span className="text-base font-normal text-gray-600">/month</span>
                    )}
                  </div>
                  <Link 
                    href={`/c/${creator.custom_domain || creator.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button 
                      className="w-full brand-button"
                      style={{ backgroundColor: brandColor }}
                    >
                      Learn More
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {pageConfig.showTestimonials && (
        <section className="px-4 py-12 lg:px-6 bg-gray-50">
          <div className="mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                What Our Customers Say
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                    <div>
                      <h4 className="font-semibold">Customer {i}</h4>
                      <p className="text-sm text-gray-600">Happy User</p>
                    </div>
                  </div>
                  <p className="text-gray-700">
                    &quot;This product has been amazing for our business. Highly recommended!&quot;
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FAQ Section */}
      {pageConfig.showFaq && (
        <section className="px-4 py-12 lg:px-6">
          <div className="mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Frequently Asked Questions
              </h2>
            </div>
            
            <div className="space-y-6">
              {[
                {
                  question: "How does this work?",
                  answer: "Our platform makes it easy to get started with just a few clicks."
                },
                {
                  question: "What support do you offer?",
                  answer: "We provide 24/7 customer support to help you succeed."
                },
                {
                  question: "Can I cancel anytime?",
                  answer: "Yes, you can cancel your subscription at any time."
                }
              ].map((faq, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">
                    {faq.question}
                  </h3>
                  <p className="text-gray-600">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Footer CTA */}
      <section className="px-4 py-12 lg:px-6 text-center" style={{ 
        backgroundColor: `${brandColor}10` 
      }}>
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold mb-4 text-gray-900">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            Join thousands of satisfied customers today.
          </p>
          <Link 
            href={`/c/${creator.custom_domain || creator.id}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button 
              className="brand-button text-white px-8 py-3 text-lg font-medium"
              style={{ backgroundColor: brandColor }}
            >
              {pageConfig.ctaText || 'Get Started'}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}