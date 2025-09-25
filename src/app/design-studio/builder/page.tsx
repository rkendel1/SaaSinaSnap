'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Save, Eye, Wand2, BarChart3, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import { EmbedAssetType, EmbedAssetConfig } from '@/features/creator/types/embed-assets';
import { CreatorProduct } from '@/features/creator/types';

// Mock data for demonstration
const mockProducts: CreatorProduct[] = [
  {
    id: '1',
    creator_id: 'creator-1',
    name: 'Premium Course',
    description: 'Advanced web development course',
    price: 99.99,
    currency: 'USD',
    product_type: 'one_time',
    stripe_product_id: 'prod_123',
    stripe_price_id: 'price_123',
    active: true,
    featured: true,
    metadata: {},
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    image_url: null
  },
  {
    id: '2',
    creator_id: 'creator-1',
    name: 'Monthly Subscription',
    description: 'Access to all content',
    price: 29.99,
    currency: 'USD',
    product_type: 'subscription',
    stripe_product_id: 'prod_456',
    stripe_price_id: 'price_456',
    active: true,
    featured: false,
    metadata: {},
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
    image_url: null
  }
];

const embedTypes: { value: EmbedAssetType; label: string; description: string }[] = [
  { value: 'product_card', label: 'Product Card', description: 'Full product showcase with image and features' },
  { value: 'checkout_button', label: 'Checkout Button', description: 'Simple purchase button' },
  { value: 'pricing_table', label: 'Pricing Table', description: 'Compare multiple products or plans' },
  { value: 'header', label: 'Header', description: 'Navigation header with branding' },
  { value: 'hero_section', label: 'Hero Section', description: 'Large hero banner with CTA' },
  { value: 'product_description', label: 'Product Description', description: 'Detailed product information' },
  { value: 'testimonial_section', label: 'Testimonials', description: 'Customer reviews and ratings' },
  { value: 'footer', label: 'Footer', description: 'Footer with links and branding' },
  { value: 'custom', label: 'Custom', description: 'Build your own embed' }
];

export default function EmbedBuilderPage() {
  const [selectedEmbedType, setSelectedEmbedType] = useState<EmbedAssetType>('product_card');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [embedConfig, setEmbedConfig] = useState<EmbedAssetConfig>({});
  const [embedName, setEmbedName] = useState('');
  const [embedDescription, setEmbedDescription] = useState('');
  const [version, setVersion] = useState('1.0.0');

  // Update embed config when embed type changes
  useEffect(() => {
    setEmbedConfig(prevConfig => ({
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      accentColor: '#3b82f6',
      borderRadius: '8px',
      ...prevConfig
    }));
  }, [selectedEmbedType]);

  const handleConfigChange = (key: keyof EmbedAssetConfig, value: any) => {
    setEmbedConfig(prev => ({ ...prev, [key]: value }));
  };

  const generatePreview = () => {
    // This would generate a preview URL for the embed
    console.log('Generating preview for:', { selectedEmbedType, selectedProduct, embedConfig });
  };

  const saveEmbed = () => {
    // This would save the embed configuration
    console.log('Saving embed:', { embedName, embedDescription, selectedEmbedType, selectedProduct, embedConfig, version });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/design-studio">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Studio
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Embed Builder</h1>
                <p className="text-sm text-gray-600">Create and customize your embed</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={generatePreview}>
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button onClick={saveEmbed}>
                <Save className="w-4 h-4 mr-2" />
                Save Embed
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Basic Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="embed-name">Embed Name</Label>
                  <Input 
                    id="embed-name"
                    value={embedName}
                    onChange={(e) => setEmbedName(e.target.value)}
                    placeholder="My awesome embed"
                  />
                </div>
                
                <div>
                  <Label htmlFor="embed-description">Description</Label>
                  <Textarea 
                    id="embed-description"
                    value={embedDescription}
                    onChange={(e) => setEmbedDescription(e.target.value)}
                    placeholder="Describe your embed..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="version">Version</Label>
                  <Input 
                    id="version"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    placeholder="1.0.0"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Embed Type Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Embed Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Label>Select Embed Type</Label>
                  <Select value={selectedEmbedType} onValueChange={(value: EmbedAssetType) => setSelectedEmbedType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose embed type" />
                    </SelectTrigger>
                    <SelectContent>
                      {embedTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm text-gray-500">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Product Selection */}
            {(selectedEmbedType === 'product_card' || selectedEmbedType === 'checkout_button' || selectedEmbedType === 'product_description') && (
              <Card>
                <CardHeader>
                  <CardTitle>Product Selection</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Label>Select Product</Label>
                    <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a product" />
                      </SelectTrigger>
                      <SelectContent>
                        {mockProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            <div>
                              <div className="font-medium">{product.name}</div>
                              <div className="text-sm text-gray-500">
                                {product.currency} {product.price} - {product.product_type}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI Assistant */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="w-5 h-5" />
                  AI Assistant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Textarea 
                    placeholder="Ask AI to customize your embed... e.g., 'Make it more professional' or 'Add a gradient background'"
                    rows={3}
                  />
                  <Button className="w-full" variant="outline">
                    <Wand2 className="w-4 h-4 mr-2" />
                    Apply AI Suggestions
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview and Advanced Settings */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="preview" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="styling">Styling</TabsTrigger>
                <TabsTrigger value="content">Content</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="preview">
                <Card>
                  <CardHeader>
                    <CardTitle>Live Preview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center min-h-[400px] flex items-center justify-center">
                      <div className="text-gray-500">
                        <div className="text-lg font-medium mb-2">Embed Preview</div>
                        <div className="text-sm">
                          {selectedEmbedType ? `${embedTypes.find(t => t.value === selectedEmbedType)?.label} embed` : 'Select an embed type to see preview'}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="styling">
                <Card>
                  <CardHeader>
                    <CardTitle>Styling Options</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="bg-color">Background Color</Label>
                        <Input 
                          id="bg-color"
                          type="color" 
                          value={embedConfig.backgroundColor || '#ffffff'}
                          onChange={(e) => handleConfigChange('backgroundColor', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="text-color">Text Color</Label>
                        <Input 
                          id="text-color"
                          type="color"
                          value={embedConfig.textColor || '#1f2937'}
                          onChange={(e) => handleConfigChange('textColor', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="accent-color">Accent Color</Label>
                        <Input 
                          id="accent-color"
                          type="color"
                          value={embedConfig.accentColor || '#3b82f6'}
                          onChange={(e) => handleConfigChange('accentColor', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="border-radius">Border Radius</Label>
                        <Select 
                          value={embedConfig.borderRadius || '8px'} 
                          onValueChange={(value) => handleConfigChange('borderRadius', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0px">None</SelectItem>
                            <SelectItem value="4px">Small</SelectItem>
                            <SelectItem value="8px">Medium</SelectItem>
                            <SelectItem value="12px">Large</SelectItem>
                            <SelectItem value="24px">Extra Large</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content">
                <Card>
                  <CardHeader>
                    <CardTitle>Content Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="custom-title">Custom Title</Label>
                      <Input 
                        id="custom-title"
                        value={embedConfig.content?.title || ''}
                        onChange={(e) => handleConfigChange('content', { ...embedConfig.content, title: e.target.value })}
                        placeholder="Enter custom title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="custom-description">Custom Description</Label>
                      <Textarea 
                        id="custom-description"
                        value={embedConfig.content?.description || ''}
                        onChange={(e) => handleConfigChange('content', { ...embedConfig.content, description: e.target.value })}
                        placeholder="Enter custom description"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label htmlFor="cta-text">Call-to-Action Text</Label>
                      <Input 
                        id="cta-text"
                        value={embedConfig.content?.ctaText || ''}
                        onChange={(e) => handleConfigChange('content', { ...embedConfig.content, ctaText: e.target.value })}
                        placeholder="Get Started"
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Analytics & Testing
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">0</div>
                        <div className="text-sm text-blue-800">Views</div>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">0%</div>
                        <div className="text-sm text-green-800">Conversion Rate</div>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-3">A/B Testing</h4>
                      <Button variant="outline" className="w-full">
                        <Copy className="w-4 h-4 mr-2" />
                        Create A/B Test Variant
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}