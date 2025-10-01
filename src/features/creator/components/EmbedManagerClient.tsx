'use client';

import { useEffect,useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Copy, Edit, Eye, History, Loader2,Plus, Search, Share, Trash2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { 
  createEmbedAssetAction,
  deleteEmbedAssetAction, 
  duplicateEmbedAssetAction, 
  toggleAssetShareAction,
  updateEmbedAssetAction
} from '@/features/creator/actions/embed-asset-actions';
import { AssetPreview } from '@/features/creator/components/AssetPreview';
import { EnhancedCreateAssetDialog } from '@/features/creator/components/EnhancedCreateAssetDialog';
import { CreatorProduct,CreatorProfile } from '@/features/creator/types';
import { CreateEmbedAssetRequest,EmbedAsset, EmbedAssetType } from '@/features/creator/types/embed-assets';

const embedTypeLabels: Record<EmbedAssetType, string> = {
  product_card: 'Product Card',
  checkout_button: 'Checkout Button',
  pricing_table: 'Pricing Table',
  header: 'Header',
  hero_section: 'Hero Section',
  product_description: 'Product Description',
  testimonial_section: 'Testimonials',
  footer: 'Footer',
  trial_embed: 'Trial Embed',
  custom: 'Custom'
};

interface EmbedManagerClientProps {
  initialEmbeds: EmbedAsset[];
  creatorProfile: CreatorProfile;
  products: CreatorProduct[];
}

export function EmbedManagerClient({ initialEmbeds, creatorProfile, products }: EmbedManagerClientProps) {
  const [embeds, setEmbeds] = useState<EmbedAsset[]>(initialEmbeds);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isActionLoading, setIsActionLoading] = useState(false); // For individual asset actions

  const [isCreateEditDialogOpen, setIsCreateEditDialogOpen] = useState(false); // For create/edit dialog
  const [selectedAssetForEdit, setSelectedAssetForEdit] = useState<EmbedAsset | null>(null); // For editing

  const filteredEmbeds = embeds.filter(embed => {
    const matchesSearch = embed.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         embed.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         embed.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesType = filterType === 'all' || embed.asset_type === filterType;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && embed.active) ||
                         (filterStatus === 'inactive' && !embed.active);

    return matchesSearch && matchesType && matchesStatus;
  });

  const handleCreateNewEmbed = () => {
    setSelectedAssetForEdit(null); // Clear selection for new creation
    setIsCreateEditDialogOpen(true);
  };

  const handleEditEmbed = (asset: EmbedAsset) => {
    setSelectedAssetForEdit(asset);
    setIsCreateEditDialogOpen(true);
  };

  const handleSaveAsset = async (assetData: CreateEmbedAssetRequest, assetId?: string) => {
    setIsActionLoading(true);
    try {
      let resultAsset: EmbedAsset;
      if (assetId) {
        resultAsset = await updateEmbedAssetAction(assetId, assetData);
        setEmbeds(prev => prev.map(asset => asset.id === assetId ? resultAsset : asset));
        toast({ description: 'Asset updated successfully!' });
      } else {
        resultAsset = await createEmbedAssetAction(assetData);
        setEmbeds(prev => [resultAsset, ...prev]);
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
      setIsActionLoading(false);
    }
  };

  const handleDeleteEmbed = async (id: string) => {
    if (!confirm('Are you sure you want to delete this embed asset? This action cannot be undone.')) {
      return;
    }
    setIsActionLoading(true);
    try {
      await deleteEmbedAssetAction(id);
      setEmbeds(prev => prev.filter(embed => embed.id !== id));
      toast({ description: 'Embed asset deleted successfully!' });
    } catch (error) {
      toast({ variant: 'destructive', description: 'Failed to delete embed asset. Please try again.' });
      console.error('Error deleting embed asset:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDuplicateEmbed = async (id: string) => {
    setIsActionLoading(true);
    try {
      const duplicatedAsset = await duplicateEmbedAssetAction(id);
      setEmbeds(prev => [duplicatedAsset, ...prev]);
      toast({ description: 'Embed asset duplicated successfully!' });
    } catch (error) {
      toast({ variant: 'destructive', description: 'Failed to duplicate embed asset. Please try again.' });
      console.error('Error duplicating embed asset:', error);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleToggleShare = async (id: string, enabled: boolean) => {
    setIsActionLoading(true);
    try {
      const updatedAsset = await toggleAssetShareAction(id, enabled);
      setEmbeds(prev => prev.map(asset => 
        asset.id === id ? updatedAsset : asset
      ));
      toast({
        description: enabled ? 'Asset sharing enabled!' : 'Asset sharing disabled!',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        description: 'Failed to toggle sharing. Please try again.',
      });
      console.error('Error toggling share:', error);
    } finally {
      setIsActionLoading(false);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/creator/design-studio">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Studio
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Embed Management</h1>
                <p className="text-sm text-gray-600">Manage and track your embed assets</p>
              </div>
            </div>
            <Button onClick={handleCreateNewEmbed} disabled={isActionLoading}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Embed
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Embeds</p>
                  <p className="text-2xl font-bold text-gray-900">{embeds.length}</p>
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-blue-600 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Embeds</p>
                  <p className="text-2xl font-bold text-gray-900">{embeds.filter(e => e.active).length}</p>
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-green-600 rounded"></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-2xl font-bold text-gray-900">{embeds.reduce((sum, e) => sum + (e.view_count || 0), 0).toLocaleString()}</p>
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Eye className="w-4 h-4 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversions</p>
                  <p className="text-2xl font-bold text-gray-900">{embeds.reduce((sum, e) => sum + (e.usage_count || 0), 0)}</p>
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search embeds..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={filterType} onValueChange={(value: EmbedAssetType | 'all') => setFilterType(value)}>
                <SelectTrigger className="w-[180px]">
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
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Embeds List */}
        <div className="space-y-4">
          {filteredEmbeds.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-500">
                  <div className="text-lg font-medium mb-2">No embeds found</div>
                  <div className="text-sm">Try adjusting your search or filters</div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredEmbeds.map((asset) => (
                <Card key={asset.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
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
                          <DropdownMenuItem onClick={() => handleEditEmbed(asset)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicateEmbed(asset.id)}>
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
                            onClick={() => handleDeleteEmbed(asset.id)} 
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
                </Card>
              ))}
            </div>
          )}
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

        {/* Create/Edit Asset Dialog */}
        {creatorProfile && (
          <EnhancedCreateAssetDialog
            isOpen={isCreateEditDialogOpen}
            onOpenChange={setIsCreateEditDialogOpen}
            onCreateAsset={handleSaveAsset} // This handles both create and update
            isLoading={isLoading}
            creatorProfile={creatorProfile}
            products={products} // Pass products to the dialog
            initialAsset={selectedAsset} // Pass selected asset for editing
          />
        )}
      </div>
    </div>
  );
}