'use client';

import { useEffect, useState } from 'react';
import { Code, Copy, Eye } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import type { CreatorProduct, CreatorProfile } from '@/features/creator/types';
import type { EmbedAssetType } from '@/features/creator/types/embed-assets';
import { ProductWithPrices } from '@/features/pricing/types';
import { getURL } from '@/utils/get-url';

// Define a flexible product type for EmbedCodeDialog
interface EmbedCodeDialogProduct {
  id: string; // Our DB product ID (creator_products.id or products.id)
  name: string | null; // Made nullable
  description?: string | null;
  price?: number | null;
  currency?: string | null; // Made nullable
  product_type?: string | null; // 'one_time' | 'subscription' // Made nullable
  stripe_product_id?: string | null; // Stripe's product ID
  stripe_price_id?: string | null; // Stripe's price ID
  image_url?: string | null;
  // For platform products, we might need to derive these from prices array
  prices?: { id: string; type: string | null; currency: string | null; unit_amount: number | null }[]; // 'type' and 'currency' can be null
}

interface EmbedCodeDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  product: EmbedCodeDialogProduct; // Use the flexible product type
  creatorProfile: CreatorProfile; // Pass the full creator profile
}

export function EmbedCodeDialog({
  isOpen,
  onOpenChange,
  product,
  creatorProfile,
}: EmbedCodeDialogProps) {
  const [activeEmbedType, setActiveEmbedType] = useState<EmbedAssetType | 'preview'>('product_card');
  const baseUrl = getURL();

  // Derive product details dynamically
  const productId = product.id;
  const productName = product.name || 'Unnamed Product'; // Provide fallback for nullable name
  const productType = product.product_type || product.prices?.[0]?.type;
  const currency = product.currency || product.prices?.[0]?.currency;
  const price = product.price || (product.prices?.[0]?.unit_amount ? product.prices[0].unit_amount / 100 : null);
  const stripePriceId = product.stripe_price_id || product.prices?.[0]?.id;
  const creatorPageSlug = creatorProfile.page_slug;

  // Function to generate the full HTML for the iframe srcDoc
  const generateFullEmbedHtml = (type: EmbedAssetType) => {
    const embedIdPrefix = 'saasinasnap-embed';
    let divId = '';
    let scriptAttributes = '';

    switch (type) {
      case 'product_card':
        divId = `${embedIdPrefix}-card-${productId}`;
        scriptAttributes = `data-product-id="${productId}" data-creator-id="${creatorProfile.id}" data-embed-type="product_card"`;
        break;
      case 'checkout_button':
        if (!stripePriceId) return '<!-- Stripe Price ID missing for checkout button -->';
        divId = `${embedIdPrefix}-checkout-button-${productId}`;
        scriptAttributes = `data-product-id="${productId}" data-creator-id="${creatorProfile.id}" data-stripe-price-id="${stripePriceId}" data-embed-type="checkout-button"`;
        break;
      case 'header':
        divId = `${embedIdPrefix}-header`;
        scriptAttributes = `data-creator-id="${creatorProfile.id}" data-embed-type="header"`;
        break;
      // Add other embed types here if you want to preview them
      default:
        return `<!-- Preview not available for ${type} -->`;
    }

    const scriptTag = `<script src="${baseUrl}/static/embed.js" ${scriptAttributes} async></script>`;
    const divTag = `<div id="${divId}"></div>`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Embed Preview</title>
        <style>
          body { margin: 0; padding: 16px; font-family: sans-serif; background-color: #f9fafb; display: flex; justify-content: center; align-items: center; min-height: 100vh; box-sizing: border-box; }
          /* Basic styling for the embed container within the iframe */
          #${divId} {
            max-width: 100%; /* Ensure responsiveness */
          }
        </style>
      </head>
      <body>
        ${divTag}
        ${scriptTag}
      </body>
      </html>
    `;
  };

  const getSnippet = (type: EmbedAssetType) => {
    const embedIdPrefix = 'saasinasnap-embed';
    let divId = '';
    let scriptAttributes = '';

    switch (type) {
      case 'product_card':
        divId = `${embedIdPrefix}-card-${productId}`;
        scriptAttributes = `data-product-id="${productId}" data-creator-id="${creatorProfile.id}" data-embed-type="product_card"`;
        break;
      case 'checkout_button':
        if (!stripePriceId) return '';
        divId = `${embedIdPrefix}-checkout-button-${productId}`;
        scriptAttributes = `data-product-id="${productId}" data-creator-id="${creatorProfile.id}" data-stripe-price-id="${stripePriceId}" data-embed-type="checkout-button"`;
        break;
      case 'header':
        divId = `${embedIdPrefix}-header`;
        scriptAttributes = `data-creator-id="${creatorProfile.id}" data-embed-type="header"`;
        break;
      default:
        return '';
    }

    return `<div id="${divId}"></div>\n<script src="${baseUrl}/static/embed.js" ${scriptAttributes} async></script>`;
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ description: 'Embed code copied to clipboard!' });
  };

  // Reset active tab when dialog opens
  useEffect(() => {
    if (isOpen) {
      setActiveEmbedType('product_card');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Embed Code for "{productName}"</DialogTitle>
          <DialogDescription>
            Copy and paste the code below into your website's HTML to embed your product.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={activeEmbedType} onValueChange={(value) => setActiveEmbedType(value as EmbedAssetType | 'preview')}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="product_card">Product Card</TabsTrigger>
            <TabsTrigger value="checkout_button" disabled={!stripePriceId}>Checkout Button</TabsTrigger>
            <TabsTrigger value="header">Header</TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Live Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="product_card" className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Displays a full product card with features and a purchase link.</p>
            <div className="relative">
              <Textarea value={getSnippet('product_card')} readOnly rows={4} className="font-mono text-xs bg-gray-50" />
              <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => handleCopy(getSnippet('product_card'))}>
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="checkout_button" className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Displays a direct checkout button for this product.</p>
            <div className="relative">
              <Textarea value={getSnippet('checkout_button')} readOnly rows={4} className="font-mono text-xs bg-gray-50" />
              <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => handleCopy(getSnippet('checkout_button'))}>
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="header" className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Displays a branded header with your logo and navigation.</p>
            <div className="relative">
              <Textarea value={getSnippet('header')} readOnly rows={4} className="font-mono text-xs bg-gray-50" />
              <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => handleCopy(getSnippet('header'))}>
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-4">
            <div className="w-full h-80 border border-gray-200 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
              {activeEmbedType !== 'preview' ? (
                <iframe
                  key={activeEmbedType} // Key to force re-render iframe on type change
                  srcDoc={generateFullEmbedHtml(activeEmbedType as EmbedAssetType)}
                  title={`${activeEmbedType} Embed Preview`}
                  className="w-full h-full border-0"
                  sandbox="allow-scripts allow-same-origin" // Essential for embed.js to run
                />
              ) : (
                <p className="text-gray-500 text-sm">Select an embed type from the tabs above to see its preview.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}