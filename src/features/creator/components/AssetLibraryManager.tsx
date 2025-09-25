'use client';

import { useState } from 'react';
import { 
  Copy, 
  Edit, 
  Eye, 
  FileText, 
  MoreHorizontal, 
  Package, 
  Plus, 
  Settings, 
  Share, 
  Trash2 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { CreatorProfile } from '@/features/creator-onboarding/types';

import { 
  createEmbedAssetAction, 
  deleteEmbedAssetAction, 
  duplicateEmbedAssetAction, 
  toggleAssetShareAction, 
  updateEmbedAssetAction 
} from '../actions/embed-asset-actions';
import type { CreateEmbedAssetRequest, EmbedAsset, EmbedAssetType } from '../types/embed-assets';

import { AssetPreview } from './AssetPreview';
import { CreateAssetDialog } from './CreateAssetDialog'; // Re-import CreateAssetDialog

interface AssetLibraryManagerProps {
  initialAssets: EmbedAsset[];
  creatorProfile: CreatorProfile;
}

export function AssetLibraryManager({ initialAssets, creatorProfile }: AssetLibraryManagerProps) {
  const [assets, setAssets] = useState<EmbedAsset[]>(initialAssets);
  const [selectedAsset, setSelectedAsset] = useState<EmbedAsset | null>(null);
  const [isCreateEditDialogOpen, setIsCreateEditDialogOpen] = useState(false); // Renamed state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<EmbedAssetType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredAssets = assets.filter(asset => {
    const matchesType = filterType === 'all' || asset.asset_type === filterType;
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleOpenCreateDialog = () => {
    setSelectedAsset(null); // Clear selected asset for creation
    setIsCreateEditDialogOpen(true);
  };

  const handleEditAsset = (asset: EmbedAsset) => {
    setSelectedAsset(asset); // Set selected asset for editing
    setIsCreateEditDialogOpen(true);
  };

  const handleSaveAsset = async (assetData: CreateEmbedAssetRequest, assetId?: string) => {
    setIsLoading(true);
    try {
      let resultAsset: EmbedAsset;
      if (assetId) {
        resultAsset = await updateEmbedAssetAction(assetId, assetData);
        setAssets(prev => prev.map(asset => asset.id === assetId ? resultAsset : asset));
        toast({ description: 'Asset updated successfully!' });
      } else {
        resultAsset = await createEmbedAssetAction(assetData);
        setAssets(prev => [resultAsset, ...prev]);
        toast({ description: 'Asset created successfully!' });
      }
      setIsCreateEditDialogOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        description: `Failed to ${assetId ? 'update' : 'create'} asset. Please try again.`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAsset = async (assetId: string) => {
    if (!confirm('Are you sure you want to delete this asset? This action cannot be undone.')) {
      return;
    }
    
    setIsLoading(true);
    try {
      await deleteEmbedAssetAction(assetId);
      setAssets(prev => prev.filter(asset => asset.id !== assetId));
      toast({
        description: 'Asset deleted successfully!',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Failed to delete asset. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicateAsset = async (assetId: string) => {
    setIsLoading(true);
    try {
      const duplicatedAsset = await duplicateEmbedAssetAction(assetId);
      setAssets(prev => [duplicatedAsset, ...prev]);
      toast({
        description: 'Asset duplicated successfully!',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Failed to duplicate asset. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleShare = async (assetId: string, enabled: boolean) => {
    setIsLoading(true);
    try {
      const updatedAsset = await toggleAssetShareAction(assetId, enabled);
      setAssets(prev => prev.map(asset => 
        asset.id === assetId ? updatedAsset : asset
      ));
      toast({
        description: enabled ? 'Asset sharing enabled!' : 'Asset sharing disabled!',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Failed to toggle sharing. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getAssetIcon = (type: EmbedAssetType) => {
    switch (type) {
      case 'product_card':
        return <Package className="h-4 w-4" />;
      case 'checkout_button':
        return <Settings className="h-4 w-4" />;
      case 'pricing_table':
        return <FileText className="h-4 w-4" />;
      case 'custom':
        return <Edit className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const formatAssetType = (type: EmbedAssetType) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-sm"
          />
          
          <Select value={filterType} onValueChange={(value: EmbedAssetType | 'all') => setFilterType(value)}>
            <SelectTrigger className="max-w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="product_card">Product Cards</SelectItem>
              <SelectItem value="checkout_button">Checkout Buttons</SelectItem>
              <SelectItem value="pricing_table">Pricing Tables</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleOpenCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Create Asset
        </Button>
      </div>

      {/* Assets Grid */}
      {filteredAssets.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery || filterType !== 'all' ? 'No assets match your filters' : 'No assets yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || filterType !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first embed asset to get started'
            }
          </p>
          {(!searchQuery && filterType === 'all') && (
            <Button onClick={handleOpenCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Create Asset
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredAssets.map((asset) => (
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
                      <DropdownMenuItem onClick={() => handleEditAsset(asset)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicateAsset(asset.id)}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleToggleShare(asset.id, !asset.share_enabled)}
                      >
                        <Share className="h-4 w-4 mr-2" />
                        {asset.share_enabled ? 'Disable' : 'Enable'} Sharing
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteAsset(asset.id)} 
                        className="text-red-600"
                      >
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
      )}

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

      {/* Create/Edit Asset Dialog */}
      <CreateAssetDialog
        isOpen={isCreateEditDialogOpen}
        onOpenChange={setIsCreateEditDialogOpen}
        onSaveAsset={handleSaveAsset}
        isLoading={isLoading}
        creatorProfile={creatorProfile}
        initialAsset={selectedAsset}
      />
    </div>
  );
}