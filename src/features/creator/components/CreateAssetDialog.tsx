'use client';

import { useState } from 'react';
import { Loader2,Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { CreatorProfile } from '@/features/creator-onboarding/types';

import type { CreateEmbedAssetRequest, EmbedAssetType } from '../types/embed-assets';

interface CreateAssetDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateAsset: (asset: CreateEmbedAssetRequest) => Promise<void>;
  isLoading: boolean;
  creatorProfile: CreatorProfile;
}

export function CreateAssetDialog({ 
  isOpen, 
  onOpenChange, 
  onCreateAsset, 
  isLoading,
  creatorProfile 
}: CreateAssetDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    asset_type: 'product_card' as EmbedAssetType,
    embed_config: {
      productName: '',
      price: '',
      currency: 'USD',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      accentColor: creatorProfile.brand_color || '#3b82f6',
      borderRadius: '8px',
      buttonText: 'Buy Now',
      buttonStyle: 'solid' as const,
      showImage: true,
      showDescription: true,
      showPrice: true,
      imageUrl: creatorProfile.business_logo_url || '',
      features: ['Feature 1', 'Feature 2', 'Feature 3'],
      highlighted: false,
      customHtml: '', // Added customHtml
      customCss: '', // Added customCss
    },
    tags: [] as string[],
    is_public: false,
    featured: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    await onCreateAsset({
      name: formData.name,
      description: formData.description || undefined,
      asset_type: formData.asset_type,
      embed_config: formData.embed_config,
      tags: formData.tags,
      is_public: formData.is_public,
      featured: formData.featured,
    });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      asset_type: 'product_card',
      embed_config: {
        productName: '',
        price: '',
        currency: 'USD',
        backgroundColor: '#ffffff',
        textColor: '#000000',
        accentColor: creatorProfile.brand_color || '#3b82f6',
        borderRadius: '8px',
        buttonText: 'Buy Now',
        buttonStyle: 'solid',
        showImage: true,
        showDescription: true,
        showPrice: true,
        imageUrl: creatorProfile.business_logo_url || '',
        features: ['Feature 1', 'Feature 2', 'Feature 3'],
        highlighted: false,
        customHtml: '',
        customCss: '',
      },
      tags: [],
      is_public: false,
      featured: false,
    });
  };

  const updateEmbedConfig = (key: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      embed_config: {
        ...prev.embed_config,
        [key]: value,
      },
    }));
  };

  const renderAssetTypeFields = () => {
    switch (formData.asset_type) {
      case 'product_card':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  value={formData.embed_config.productName}
                  onChange={(e) => updateEmbedConfig('productName', e.target.value)}
                  placeholder="My Amazing Product"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  value={formData.embed_config.price}
                  onChange={(e) => updateEmbedConfig('price', e.target.value)}
                  placeholder="$29"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL (optional)</Label>
              <Input
                id="imageUrl"
                type="url"
                value={formData.embed_config.imageUrl}
                onChange={(e) => updateEmbedConfig('imageUrl', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>
        );

      case 'checkout_button':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="buttonText">Button Text</Label>
                <Input
                  id="buttonText"
                  value={formData.embed_config.buttonText}
                  onChange={(e) => updateEmbedConfig('buttonText', e.target.value)}
                  placeholder="Buy Now"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="buttonStyle">Button Style</Label>
                <Select 
                  value={formData.embed_config.buttonStyle} 
                  onValueChange={(value) => updateEmbedConfig('buttonStyle', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Solid</SelectItem>
                    <SelectItem value="outline">Outline</SelectItem>
                    <SelectItem value="ghost">Ghost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 'pricing_table':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="planName">Plan Name</Label>
                <Input
                  id="planName"
                  value={formData.embed_config.productName}
                  onChange={(e) => updateEmbedConfig('productName', e.target.value)}
                  placeholder="Basic Plan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="planPrice">Price</Label>
                <Input
                  id="planPrice"
                  value={formData.embed_config.price}
                  onChange={(e) => updateEmbedConfig('price', e.target.value)}
                  placeholder="$29"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="features">Features (one per line)</Label>
              <Textarea
                id="features"
                value={formData.embed_config.features?.join('\n') || ''}
                onChange={(e) => updateEmbedConfig('features', e.target.value.split('\n').filter(f => f.trim()))}
                placeholder="Unlimited projects&#10;24/7 support&#10;Advanced analytics"
                rows={4}
              />
            </div>
          </div>
        );

      case 'custom':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customHtml">Custom HTML</Label>
              <Textarea
                id="customHtml"
                value={formData.embed_config.customHtml || ''}
                onChange={(e) => updateEmbedConfig('customHtml', e.target.value)}
                placeholder="<div>Your custom HTML here</div>"
                rows={6}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="customCss">Custom CSS (optional)</Label>
              <Textarea
                id="customCss"
                value={formData.embed_config.customCss || ''}
                onChange={(e) => updateEmbedConfig('customCss', e.target.value)}
                placeholder=".my-class { color: red; }"
                rows={4}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { onOpenChange(open); if (!open) resetForm(); }}>
      <DialogTrigger asChild>
        <Button onClick={() => onOpenChange(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Asset
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Embed Asset</DialogTitle>
          <DialogDescription>
            Create a new embed asset that you can use on websites and share with others.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Asset Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="My Awesome Product Card"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what this asset is for..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assetType">Asset Type</Label>
              <Select 
                value={formData.asset_type} 
                onValueChange={(value: EmbedAssetType) => setFormData(prev => ({ ...prev, asset_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="product_card">Product Card</SelectItem>
                  <SelectItem value="checkout_button">Checkout Button</SelectItem>
                  <SelectItem value="pricing_table">Pricing Table</SelectItem>
                  <SelectItem value="custom">Custom HTML</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Asset Type Specific Fields */}
          {renderAssetTypeFields()}

          {/* Styling Options */}
          <div className="space-y-4">
            <h4 className="font-medium">Styling</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="backgroundColor">Background Color</Label>
                <Input
                  id="backgroundColor"
                  type="color"
                  value={formData.embed_config.backgroundColor}
                  onChange={(e) => updateEmbedConfig('backgroundColor', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="textColor">Text Color</Label>
                <Input
                  id="textColor"
                  type="color"
                  value={formData.embed_config.textColor}
                  onChange={(e) => updateEmbedConfig('textColor', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accentColor">Accent Color</Label>
                <Input
                  id="accentColor"
                  type="color"
                  value={formData.embed_config.accentColor}
                  onChange={(e) => updateEmbedConfig('accentColor', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !formData.name.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Asset'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}