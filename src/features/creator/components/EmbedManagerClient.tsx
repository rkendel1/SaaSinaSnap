'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Copy, Eye, BarChart3, History, Plus, Search, Share, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';

import { 
  deleteEmbedAssetAction, 
  duplicateEmbedAssetAction, 
  toggleAssetShareAction,
  createEmbedAssetAction,
  updateEmbedAssetAction
} from '@/features/creator/actions/embed-asset-actions';
import { EmbedAsset, EmbedAssetType, CreateEmbedAssetRequest } from '@/features/creator/types/embed-assets';
import { CreatorProfile, CreatorProduct } from '@/features/creator/types';
import { EnhancedCreateAssetDialog } from '@/features/creator/components/EnhancedCreateAssetDialog';
import { AssetPreview } from '@/features/creator/components/AssetPreview';

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
              <Plus className="w-4 h-4 mr-2" />
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
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="product_card">Product Card</SelectItem>
                  <SelectItem value="checkout_button">Checkout Button</SelectItem>
                  <SelectItem value="pricing_table">Pricing Table</SelectItem>
                  <SelectItem value="header">Header</SelectItem>
                  <SelectItem value="hero_section">Hero Section</SelectItem>
                  <SelectItem value="footer">Footer</SelectItem>
                  <SelectItem value="trial_embed">Trial Embed</SelectItem>
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
          {filteredEmbeds.map((embed) => (
            <Card key={embed.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                      <AssetPreview asset={embed} size="small" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-900">{embed.name}</h3>
                        <Badge variant={embed.active ? 'default' : 'secondary'}>
                          {embed.active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Badge variant="outline">
                          {embedTypeLabels[embed.asset_type]}
                        </Badge>
                        {embed.featured && (
                          <Badge variant="secondary">Featured</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{embed.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{(embed.view_count || 0).toLocaleString()} views</span>
                        <span>{embed.usage_count || 0} conversions</span>
                        <span>Updated {new Date(embed.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleToggleShare(embed.id, !embed.share_enabled)} disabled={isActionLoading}>
                      <Share className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDuplicateEmbed(embed.id)} disabled={isActionLoading}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleEditEmbed(embed)} disabled={isActionLoading}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteEmbed(embed.id)}
                      className="text-red-600 hover:text-red-700"
                      disabled={isActionLoading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredEmbeds.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="text-gray-500">
                <div className="text-lg font-medium mb-2">No embeds found</div>
                <div className="text-sm">Try adjusting your search or filters</div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Asset Dialog */}
      {creatorProfile && (
        <EnhancedCreateAssetDialog
          isOpen={isCreateEditDialogOpen}
          onOpenChange={setIsCreateEditDialogOpen}
          onCreateAsset={handleSaveAsset}
          isLoading={isActionLoading}
          creatorProfile={creatorProfile}
          products={products}
          initialAsset={selectedAssetForEdit}
        />
      )}
    </div>
  );
}