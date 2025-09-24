'use client';

import { Code, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { getURL } from '@/utils/get-url';

interface EmbedCodeDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  productName: string;
  productId: string;
  creatorId: string;
  stripePriceId: string | null;
}

export function EmbedCodeDialog({
  isOpen,
  onOpenChange,
  productName,
  productId,
  creatorId,
  stripePriceId,
}: EmbedCodeDialogProps) {
  const baseUrl = getURL();

  const snippets = {
    card: `<div id="paylift-embed-card-${productId}"></div>\n<script src="${baseUrl}/static/embed.js" data-product-id="${productId}" data-creator-id="${creatorId}" data-embed-type="card" async></script>`,
    button: `<div id="paylift-embed-checkout-button-${productId}"></div>\n<script src="${baseUrl}/static/embed.js" data-product-id="${productId}" data-creator-id="${creatorId}" data-stripe-price-id="${stripePriceId}" data-embed-type="checkout-button" async></script>`,
    header: `<div id="paylift-embed-header"></div>\n<script src="${baseUrl}/static/embed.js" data-creator-id="${creatorId}" data-embed-type="header" async></script>`,
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ description: 'Embed code copied to clipboard!' });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Embed Code for "{productName}"</DialogTitle>
          <DialogDescription>
            Copy and paste the code below into your website's HTML to embed your product.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="card" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="card">Product Card</TabsTrigger>
            <TabsTrigger value="button" disabled={!stripePriceId}>Checkout Button</TabsTrigger>
            <TabsTrigger value="header">Header</TabsTrigger>
          </TabsList>
          <TabsContent value="card" className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Displays a full product card with features and a purchase link.</p>
            <div className="relative">
              <Textarea value={snippets.card} readOnly rows={4} className="font-mono text-xs bg-gray-50" />
              <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => handleCopy(snippets.card)}>
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="button" className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Displays a direct checkout button for this product.</p>
            <div className="relative">
              <Textarea value={snippets.button} readOnly rows={4} className="font-mono text-xs bg-gray-50" />
              <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => handleCopy(snippets.button)}>
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
            </div>
          </TabsContent>
          <TabsContent value="header" className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Displays a branded header with your logo and navigation.</p>
            <div className="relative">
              <Textarea value={snippets.header} readOnly rows={4} className="font-mono text-xs bg-gray-50" />
              <Button variant="ghost" size="sm" className="absolute top-2 right-2" onClick={() => handleCopy(snippets.header)}>
                <Copy className="h-3 w-3 mr-1" /> Copy
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}