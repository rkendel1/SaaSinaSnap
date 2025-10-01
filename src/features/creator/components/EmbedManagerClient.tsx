'use client';

import { useState } from 'react';
import { Code, Copy, Edit, Eye, MoreHorizontal, Package, Plus, Settings, Share, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AssetPreview } from '@/features/creator/components/AssetPreview';
import type { CreatorProduct, CreatorProfile } from '@/features/creator/types';
import type { EmbedAsset, EmbedAssetType } from '@/features/creator/types/embed-assets';

interface EmbedManagerClientProps {
  initialEmbeds: EmbedAsset[];
  creatorProfile: CreatorProfile;
  products: CreatorProduct[];
}

export function EmbedManagerClient({ initialEmbeds, creatorProfile, products }: EmbedManagerClientProps) {
  const [assets, setAssets] = useState<EmbedAsset[]>(initialEmbeds);
  const [selectedAsset, setSelectedAsset] = useState<EmbedAsset | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const getAssetIcon = (type: EmbedAssetType) => {
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

  const formatAssetType = (type: EmbedAssetType) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Embeds & Scripts</h1>
          <p className="text-gray-600">Manage your embeddable components.</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Embed
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {assets.map((asset) => (
          <div key={asset.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="aspect-video bg-gray-50 flex items-center justify-center border-b border-gray-200">
              <AssetPreview asset={asset} size="small" />
            </div>
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
                      <Eye className="h-4 w-4 mr-2" /> Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Edit className="h-4 w-4 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Copy className="h-4 w-4 mr-2" /> Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Share className="h-4 w-4 mr-2" /> Share
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{asset.description || 'No description'}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{formatAssetType(asset.asset_type)}</span>
                <div className="flex items-center gap-3">
                  <span>{asset.view_count || 0} views</span>
                  {asset.share_enabled && <span className="text-green-600">Shared</span>}
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
            <DialogDescription>Preview how your embed will appear on websites</DialogDescription>
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