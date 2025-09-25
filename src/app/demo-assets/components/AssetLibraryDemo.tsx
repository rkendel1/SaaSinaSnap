'use client';

import { useState } from 'react';
import { Copy, Edit, Eye, FileText, MoreHorizontal, Package, Plus, Settings, Share, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AssetPreview } from '@/features/creator/components/AssetPreview';
import type { EmbedAsset } from '@/features/creator/types/embed-assets';

// Mock data for demonstration
const mockAssets: EmbedAsset[] = [
  {
    id: '1',
    creator_id: 'demo',
    name: 'Premium Product Card',
    description: 'A beautiful product card for premium offerings',
    asset_type: 'product_card',
    embed_config: {
      productName: 'Premium Plan',
      price: '$99',
      currency: 'USD',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      accentColor: '#3b82f6',
      borderRadius: '12px',
      showImage: true,
      showDescription: true,
      showPrice: true,
      imageUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=250&fit=crop',
    },
    preview_url: null,
    active: true,
    is_public: false,
    featured: true,
    share_token: 'share-token-1',
    share_enabled: true,
    view_count: 245,
    usage_count: 12,
    tags: ['premium', 'product'],
    metadata: {},
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    creator_id: 'demo',
    name: 'CTA Button - Blue',
    description: 'Eye-catching call-to-action button',
    asset_type: 'checkout_button',
    embed_config: {
      buttonText: 'Get Started Today',
      buttonStyle: 'solid',
      backgroundColor: '#ffffff',
      textColor: '#ffffff',
      accentColor: '#2563eb',
      borderRadius: '8px',
    },
    preview_url: null,
    active: true,
    is_public: true,
    featured: false,
    share_token: null,
    share_enabled: false,
    view_count: 89,
    usage_count: 5,
    tags: ['cta', 'button'],
    metadata: {},
    created_at: '2024-01-10T10:00:00Z',
    updated_at: '2024-01-10T10:00:00Z',
  },
  {
    id: '3',
    creator_id: 'demo',
    name: 'Basic Pricing Table',
    description: 'Simple pricing table for subscription plans',
    asset_type: 'pricing_table',
    embed_config: {
      productName: 'Starter Plan',
      price: '$29',
      currency: 'month',
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      accentColor: '#10b981',
      features: ['10 Projects', '100GB Storage', 'Email Support', 'Basic Analytics'],
      highlighted: false,
    },
    preview_url: null,
    active: true,
    is_public: false,
    featured: false,
    share_token: 'share-token-3',
    share_enabled: true,
    view_count: 156,
    usage_count: 8,
    tags: ['pricing', 'subscription'],
    metadata: {},
    created_at: '2024-01-05T10:00:00Z',
    updated_at: '2024-01-05T10:00:00Z',
  },
];

export function AssetLibraryDemo() {
  const [selectedAsset, setSelectedAsset] = useState<EmbedAsset | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const getAssetIcon = (type: string) => {
    switch (type) {
      case 'product_card':
        return <Package className="h-4 w-4" />;
      case 'checkout_button':
        return <Settings className="h-4 w-4" />;
      case 'pricing_table':
        return <FileText className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const formatAssetType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="text-sm text-gray-600">
          Showing {mockAssets.length} assets
        </div>

        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Asset
        </Button>
      </div>

      {/* Assets Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mockAssets.map((asset) => (
          <div key={asset.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {/* Asset Preview */}
            <div className="aspect-video bg-gray-50 flex items-center justify-center border-b border-gray-200">
              <AssetPreview asset={asset} size="small" />
            </div>

            {/* Asset Details */}
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getAssetIcon(asset.asset_type)}
                  <h3 className="font-semibold text-gray-900 truncate">{asset.name}</h3>
                </div>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => {
                        setSelectedAsset(asset);
                        setIsPreviewOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Share className="h-4 w-4 mr-2" />
                      {asset.share_enabled ? 'Disable' : 'Enable'} Sharing
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                {asset.description || 'No description'}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatAssetType(asset.asset_type)}</span>
                <div className="flex items-center gap-3">
                  <span>{asset.view_count} views</span>
                  {asset.share_enabled && (
                    <span className="text-green-600">Shared</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Asset Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedAsset?.name}</DialogTitle>
            <DialogDescription>
              Preview how your embed will appear on websites
            </DialogDescription>
          </DialogHeader>
          
          {selectedAsset && (
            <div className="mt-4">
              <AssetPreview asset={selectedAsset} size="large" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}