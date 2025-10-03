'use client';

import { useState } from 'react';
import { 
  Copy, 
  Edit, 
  Eye, 
  FileText, 
  Info,
  MoreHorizontal, 
  Package, 
  Plus, 
  Search,
  Settings, 
  Share, 
  Trash2,
  X
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { CreatorProduct,CreatorProfile } from '@/features/creator/types';
import { ExtractedBrandingData } from '@/features/creator-onboarding/types';
import { extractDesignTokens } from '@/utils/design-tokens';

import { 
  createEmbedAssetAction, 
  deleteEmbedAssetAction, 
  duplicateEmbedAssetAction, 
  toggleAssetShareAction, 
  updateEmbedAssetAction 
} from '../actions/embed-asset-actions';
import type { CreateEmbedAssetRequest, EmbedAsset, EmbedAssetType } from '../types/embed-assets';

import { AssetPreview } from './AssetPreview';
import { EnhancedCreateAssetDialog } from './EnhancedCreateAssetDialog'; // Use EnhancedCreateAssetDialog

interface EnhancedAssetLibraryManagerProps {
  initialAssets: EmbedAsset[];
  creatorProfile: CreatorProfile;
  products: CreatorProduct[]; // Pass products to the manager
}

export function EnhancedAssetLibraryManager({ initialAssets, creatorProfile, products }: EnhancedAssetLibraryManagerProps) {
  const [assets, setAssets] = useState<EmbedAsset[]>(initialAssets);
  const [selectedAsset, setSelectedAsset] = useState<EmbedAsset | null>(null);
  const [isCreateEditDialogOpen, setIsCreateEditDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isBrandingInfoOpen, setIsBrandingInfoOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<EmbedAssetType | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const extractedData = creatorProfile.extracted_branding_data as ExtractedBrandingData | null;
  const designTokens = extractDesignTokens(creatorProfile);

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
      console.error('Error saving asset:', error);
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
      case 'header':
        return <Settings className="h-4 w-4" />;
      case 'hero_section':
        return <Eye className="h-4 w-4" />;
      case 'product_description':
        return <FileText className="h-4 w-4" />;
      case 'testimonial_section':
        return <FileText className="h-4 w-4" />;
      case 'footer':
        return <FileText className="h-4 w-4" />;
      case 'trial_embed':
        return <FileText className="h-4 w-4" />;
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
              <SelectItem value="header">Headers</SelectItem>
              <SelectItem value="hero_section">Hero Sections</SelectItem>
              <SelectItem value="product_description">Product Descriptions</SelectItem>
              <SelectItem value="testimonial_section">Testimonials</SelectItem>
              <SelectItem value="footer">Footers</SelectItem>
              <SelectItem value="trial_embed">Trial Embeds</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          {extractedData && (
            <Button variant="outline" onClick={() => setIsBrandingInfoOpen(true)}>
              <Info className="h-4 w-4 mr-2" />
              Design Tokens
            </Button>
          )}
          <Button onClick={handleOpenCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Create Asset
          </Button>
        </div>
      </div>

      {/* Branding Info Banner - Show when data is available */}
      {extractedData && (
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="bg-white p-2 rounded-lg">
                <Info className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Site Analyzer Data Available</h3>
                <p className="text-sm text-gray-600 mb-2">
                  Design tokens extracted from your website. Embeds will inherit these styles when deployed.
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="bg-white px-2 py-1 rounded border">
                    Brand Color: <strong style={{ color: designTokens['--brand-color'] }}>{designTokens['--brand-color']}</strong>
                  </span>
                  {designTokens['--font-family'] && designTokens['--font-family'] !== 'inherit' && (
                    <span className="bg-white px-2 py-1 rounded border">
                      Font: <strong>{designTokens['--font-family']}</strong>
                    </span>
                  )}
                  {extractedData.voiceAndTone && (
                    <span className="bg-white px-2 py-1 rounded border">
                      Tone: <strong>{extractedData.voiceAndTone.tone}</strong>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsBrandingInfoOpen(true)}>
              View All
            </Button>
          </div>
        </div>
      )}

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
                      <DropdownMenuItem 
                        onClick={() => {
                          // Navigate to embed preview page with code pre-filled
                          const embedCode = asset.embed_config?.embedCode || '';
                          if (embedCode) {
                            window.open(`/embed-preview?code=${encodeURIComponent(embedCode)}`, '_blank');
                          } else {
                            toast({ 
                              description: 'No embed code available for this asset.', 
                              variant: 'destructive' 
                            });
                          }
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View in Preview Studio
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
                    <span>{(asset.view_count || 0).toLocaleString()} views</span>
                    <span>{asset.usage_count || 0} conversions</span>
                    <span>Updated {new Date(asset.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Asset Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              {selectedAsset?.name}
            </DialogTitle>
            <DialogDescription>
              Preview how your embed will appear on websites and get the embed code
            </DialogDescription>
          </DialogHeader>
          
          {selectedAsset && (
            <div className="mt-4 space-y-6">
              {/* Visual Preview */}
              <div className="border rounded-lg p-6 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Visual Preview</h3>
                <AssetPreview asset={selectedAsset} size="large" />
              </div>

              {/* Embed Code Section */}
              {selectedAsset.embed_config?.embedCode && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">Embed Code</h3>
                  <div className="relative">
                    <Textarea 
                      value={selectedAsset.embed_config.embedCode} 
                      readOnly 
                      rows={5} 
                      className="font-mono text-xs bg-gray-50 border-gray-300"
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="absolute top-2 right-2" 
                      onClick={() => {
                        navigator.clipboard.writeText(selectedAsset.embed_config?.embedCode || '');
                        toast({ description: 'Embed code copied to clipboard!' });
                      }}
                    >
                      <Copy className="h-4 w-4 mr-1" /> Copy
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        navigator.clipboard.writeText(selectedAsset.embed_config?.embedCode || '');
                        toast({ description: 'Embed code copied to clipboard!' });
                      }}
                      variant="outline"
                      className="flex-1"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Code
                    </Button>
                    <Button 
                      onClick={() => {
                        const embedCode = selectedAsset.embed_config?.embedCode || '';
                        window.open(`/embed-preview?code=${encodeURIComponent(embedCode)}`, '_blank');
                      }}
                      variant="default"
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Open in Preview Studio
                    </Button>
                  </div>
                </div>
              )}

              {/* Asset Metadata */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Asset Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium">{formatAssetType(selectedAsset.asset_type)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Views:</span>
                    <span className="ml-2 font-medium">{(selectedAsset.view_count || 0).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Conversions:</span>
                    <span className="ml-2 font-medium">{selectedAsset.usage_count || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Updated:</span>
                    <span className="ml-2 font-medium">{new Date(selectedAsset.updated_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Asset Dialog */}
      <EnhancedCreateAssetDialog
        isOpen={isCreateEditDialogOpen}
        onOpenChange={setIsCreateEditDialogOpen}
        onCreateAsset={handleSaveAsset} // This handles both create and update
        isLoading={isLoading}
        creatorProfile={creatorProfile}
        products={products} // Pass products to the dialog
        initialAsset={selectedAsset} // Pass selected asset for editing
      />

      {/* Branding Info Dialog */}
      <Dialog open={isBrandingInfoOpen} onOpenChange={setIsBrandingInfoOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Design Tokens & Site Analyzer Data</DialogTitle>
            <DialogDescription>
              Information extracted from your website that embeds will inherit
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 mt-4">
            {/* Design Tokens */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Design Tokens
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(designTokens).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 p-3 rounded-lg border">
                    <div className="text-xs text-gray-500 mb-1">{key}</div>
                    <div className="text-sm font-mono font-semibold">{value}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Voice and Tone */}
            {extractedData?.voiceAndTone && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Voice & Tone
                </h3>
                <div className="bg-gray-50 p-4 rounded-lg border space-y-2">
                  <div>
                    <span className="text-xs text-gray-500">Tone:</span>{' '}
                    <span className="text-sm font-medium">{extractedData.voiceAndTone.tone}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Voice:</span>{' '}
                    <span className="text-sm font-medium">{extractedData.voiceAndTone.voice}</span>
                  </div>
                  {extractedData.voiceAndTone.keyPhrases && extractedData.voiceAndTone.keyPhrases.length > 0 && (
                    <div>
                      <span className="text-xs text-gray-500">Key Phrases:</span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {extractedData.voiceAndTone.keyPhrases.map((phrase, idx) => (
                          <span key={idx} className="text-xs bg-white px-2 py-1 rounded border">
                            {phrase}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Content Samples */}
            {extractedData?.contentSamples && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Content Samples
                </h3>
                <div className="space-y-2">
                  {extractedData.contentSamples.headlines && extractedData.contentSamples.headlines.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded-lg border">
                      <div className="text-xs text-gray-500 mb-1">Headlines</div>
                      <ul className="text-sm space-y-1">
                        {extractedData.contentSamples.headlines.slice(0, 3).map((headline, idx) => (
                          <li key={idx}>{headline}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {extractedData.contentSamples.callsToAction && extractedData.contentSamples.callsToAction.length > 0 && (
                    <div className="bg-gray-50 p-3 rounded-lg border">
                      <div className="text-xs text-gray-500 mb-1">Calls to Action</div>
                      <div className="flex flex-wrap gap-2">
                        {extractedData.contentSamples.callsToAction.slice(0, 5).map((cta, idx) => (
                          <span key={idx} className="text-sm bg-white px-2 py-1 rounded border">
                            {cta}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Colors */}
            {(extractedData?.primaryColors || extractedData?.secondaryColors) && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Color Palette</h3>
                <div className="space-y-3">
                  {extractedData.primaryColors && extractedData.primaryColors.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 mb-2">Primary Colors</div>
                      <div className="flex gap-2">
                        {extractedData.primaryColors.map((color, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-1">
                            <div 
                              className="w-12 h-12 rounded border shadow-sm"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-xs font-mono">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {extractedData.secondaryColors && extractedData.secondaryColors.length > 0 && (
                    <div>
                      <div className="text-xs text-gray-500 mb-2">Secondary Colors</div>
                      <div className="flex gap-2">
                        {extractedData.secondaryColors.slice(0, 5).map((color, idx) => (
                          <div key={idx} className="flex flex-col items-center gap-1">
                            <div 
                              className="w-10 h-10 rounded border shadow-sm"
                              style={{ backgroundColor: color }}
                            />
                            <span className="text-xs font-mono">{color}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-xs text-gray-500">
                This data was extracted from your website during onboarding. Embeds will automatically inherit these styles when embedded on your site.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}