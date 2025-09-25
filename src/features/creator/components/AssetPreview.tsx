'use client';

import React from 'react';
import Image from 'next/image';

import type { EmbedAsset } from '../types/embed-assets';

interface AssetPreviewProps {
  asset: EmbedAsset;
  size?: 'small' | 'medium' | 'large';
}

export function AssetPreview({ asset, size = 'medium' }: AssetPreviewProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'w-full h-full text-xs';
      case 'medium':
        return 'w-full h-48 text-sm';
      case 'large':
        return 'w-full h-96 text-base';
      default:
        return 'w-full h-48 text-sm';
    }
  };

  const renderPreviewContent = () => {
    const config = asset.embed_config;
    
    switch (asset.asset_type) {
      case 'product_card':
        return (
          <div 
            className="bg-white rounded-lg border shadow-sm p-4 space-y-3 max-w-sm mx-auto"
            style={{
              backgroundColor: config.backgroundColor || '#ffffff',
              color: config.textColor || '#000000',
              borderColor: config.accentColor || '#e5e7eb',
              borderRadius: config.borderRadius || '8px',
            }}
          >
            {config.showImage && config.imageUrl && (
              <div className="aspect-video bg-gray-100 rounded overflow-hidden">
                <Image 
                  src={config.imageUrl} 
                  alt={config.productName || 'Product'} 
                  width={200}
                  height={112}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="space-y-2">
              <h3 className="font-semibold" style={{ color: config.textColor || '#000000' }}>
                {config.productName || 'Product Name'}
              </h3>
              {config.showDescription && (
                <p className="text-sm opacity-75">
                  A great product that solves your problems
                </p>
              )}
              {config.showPrice && (
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold" style={{ color: config.accentColor || '#000000' }}>
                    {config.price || '$29'} {config.currency || 'USD'}
                  </span>
                </div>
              )}
            </div>
          </div>
        );

      case 'checkout_button':
        return (
          <div className="flex justify-center">
            <button
              className="px-6 py-3 rounded-lg font-medium transition-colors"
              style={{
                backgroundColor: config.accentColor || '#3b82f6',
                color: config.textColor || '#ffffff',
                borderRadius: config.borderRadius || '8px',
                ...(config.buttonStyle === 'outline' && {
                  backgroundColor: 'transparent',
                  border: `2px solid ${config.accentColor || '#3b82f6'}`,
                  color: config.accentColor || '#3b82f6',
                }),
                ...(config.buttonStyle === 'ghost' && {
                  backgroundColor: 'transparent',
                  color: config.accentColor || '#3b82f6',
                }),
              }}
            >
              {config.buttonText || 'Buy Now'}
            </button>
          </div>
        );

      case 'pricing_table':
        return (
          <div className="max-w-sm mx-auto">
            <div 
              className="bg-white rounded-lg border shadow-sm p-6 space-y-4"
              style={{
                backgroundColor: config.backgroundColor || '#ffffff',
                borderColor: config.highlighted ? (config.accentColor || '#3b82f6') : '#e5e7eb',
                borderWidth: config.highlighted ? '2px' : '1px',
              }}
            >
              <div className="text-center">
                <h3 className="font-bold text-lg" style={{ color: config.textColor || '#000000' }}>
                  {config.productName || 'Basic Plan'}
                </h3>
                <div className="mt-2">
                  <span className="text-3xl font-bold" style={{ color: config.accentColor || '#000000' }}>
                    {config.price || '$29'}
                  </span>
                  <span className="text-sm opacity-75">/{config.currency || 'month'}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                {(config.features || ['Feature 1', 'Feature 2', 'Feature 3']).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <svg className="w-4 h-4" style={{ color: config.accentColor || '#10b981' }} fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
              
              <button
                className="w-full py-2 px-4 rounded font-medium"
                style={{
                  backgroundColor: config.accentColor || '#3b82f6',
                  color: '#ffffff',
                }}
              >
                Get Started
              </button>
            </div>
          </div>
        );

      case 'custom':
        return (
          <div className="bg-gray-100 rounded-lg p-4 text-center">
            <div className="space-y-2">
              <div className="text-sm font-medium text-gray-700">Custom Embed</div>
              {config.customHtml ? (
                <div 
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: config.customHtml }}
                />
              ) : (
                <p className="text-xs text-gray-500">
                  Custom HTML content will appear here
                </p>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="bg-gray-100 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">Preview not available</p>
          </div>
        );
    }
  };

  return (
    <div className={`${getSizeClasses()} flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden`}>
      <div className="w-full h-full flex items-center justify-center p-4">
        {renderPreviewContent()}
      </div>
    </div>
  );
}