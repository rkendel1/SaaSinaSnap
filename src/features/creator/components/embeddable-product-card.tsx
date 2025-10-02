'use client';

import Link from 'next/link';
import { Check } from 'lucide-react';

import { type CreatorBranding, getBrandingStyles } from '@/utils/branding-utils';
import { getURL } from '@/utils/get-url'; // To construct the full URL

import { CreatorProduct, CreatorProfile } from '../types';

interface EmbeddableProductCardProps {
  product: CreatorProduct;
  creator: CreatorProfile;
}

export function EmbeddableProductCard({ product, creator }: EmbeddableProductCardProps) {
  // Create branding object from creator profile
  const branding: CreatorBranding = {
    brandColor: creator.brand_color || '#ea580c',
    brandGradient: creator.brand_gradient,
    brandPattern: creator.brand_pattern,
  };
  
  const brandingStyles = getBrandingStyles(branding);
  
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(price);
  };

  const getPriceLabel = (productType: string | null) => {
    switch (productType) {
      case 'subscription':
        return '/month';
      case 'usage_based':
        return '/usage';
      default:
        return '';
    }
  };

  // Construct the URL to the creator's full pricing page
  const pricingPageUrl = `${getURL()}/c/${creator.custom_domain}/pricing`;

  // Placeholder for product features (could be from product.metadata)
  const features = [
    'Full access to all features',
    '24/7 customer support',
    'Cancel anytime',
  ];

  return (
    <div 
      className="relative flex flex-col rounded-lg border-2 bg-white p-6 shadow-md" 
      style={brandingStyles.brandBorder}
    >
      <div className="mb-6 text-center">
        <h3 className="mb-2 text-xl font-bold" style={brandingStyles.gradientText}>
          {product.name}
        </h3>
        {product.description && (
          <p className="mb-4 text-sm text-gray-600">
            {product.description}
          </p>
        )}
        <div className="flex items-baseline justify-center">
          <span className="text-3xl font-bold text-gray-900">
            {formatPrice(product.price ?? 0, product.currency ?? 'usd')}
          </span>
          <span className="ml-1 text-gray-600">
            {getPriceLabel(product.product_type)}
          </span>
        </div>
      </div>

      <ul className="mb-6 flex-1 space-y-3 text-left">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center text-sm text-gray-600">
            <Check className="mr-2 h-4 w-4 flex-shrink-0" style={{ color: brandingStyles.brandColor }} />
            {feature}
          </li>
        ))}
      </ul>

      <Link 
        href={pricingPageUrl} 
        target="_blank" // Open in new tab to avoid breaking embedded site
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center rounded-lg px-6 py-3 text-center font-semibold text-white transition-all duration-200 hover:scale-105"
        style={brandingStyles.primaryButton}
      >
        Get Started
      </Link>
    </div>
  );
}