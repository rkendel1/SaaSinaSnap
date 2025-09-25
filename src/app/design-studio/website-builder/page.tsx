'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Move, Trash2, Eye, Save, Settings, Layers, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

import { EmbedAsset, EmbedAssetType } from '@/features/creator/types/embed-assets';

interface StackedEmbed {
  id: string;
  embedId: string;
  embedType: EmbedAssetType;
  name: string;
  order: number;
  settings: {
    marginTop?: string;
    marginBottom?: string;
    width?: string;
    alignment?: 'left' | 'center' | 'right';
    backgroundColor?: string;
    padding?: string;
  };
}

interface WebsiteStack {
  id: string;
  name: string;
  description?: string;
  embeds: StackedEmbed[];
  globalSettings: {
    fontFamily?: string;
    primaryColor?: string;
    backgroundColor?: string;
    containerWidth?: string;
  };
  seoSettings: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}

// Mock embed assets
const mockEmbeds: EmbedAsset[] = [
  {
    id: '1',
    creator_id: 'creator-1',
    name: 'Hero Section',
    description: null,
    asset_type: 'hero_section',
    embed_config: {},
    preview_url: null,
    active: true,
    is_public: true,
    featured: false,
    share_token: null,
    share_enabled: true,
    view_count: 0,
    usage_count: 0,
    tags: null,
    metadata: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '2',
    creator_id: 'creator-1',
    name: 'Product Card',
    description: null,
    asset_type: 'product_card',
    embed_config: {},
    preview_url: null,
    active: true,
    is_public: true,
    featured: false,
    share_token: null,
    share_enabled: true,
    view_count: 0,
    usage_count: 0,
    tags: null,
    metadata: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  },
  {
    id: '3',
    creator_id: 'creator-1',
    name: 'Testimonials',
    description: null,
    asset_type: 'testimonial_section',
    embed_config: {},
    preview_url: null,
    active: true,
    is_public: true,
    featured: false,
    share_token: null,
    share_enabled: true,
    view_count: 0,
    usage_count: 0,
    tags: null,
    metadata: null,
    created_at: '2024-01-01',
    updated_at: '2024-01-01'
  }
];

export default function WebsiteBuilderPage() {
  const [websiteStack, setWebsiteStack] = useState<WebsiteStack>({
    id: 'new-website',
    name: 'My New Website',
    embeds: [],
    globalSettings: {
      fontFamily: 'Inter',
      primaryColor: '#3b82f6',
      backgroundColor: '#ffffff',
      containerWidth: '1200px'
    },
    seoSettings: {
      title: 'My Website',
      description: 'A beautiful website built with embeds'
    }
  });

  const [selectedEmbedId, setSelectedEmbedId] = useState<string>('');

  const addEmbed = useCallback(() => {
    if (!selectedEmbedId) return;

    const embed = mockEmbeds.find(e => e.id === selectedEmbedId);
    if (!embed) return;

    const newStackedEmbed: StackedEmbed = {
      id: `stacked-${Date.now()}`,
      embedId: embed.id,
      embedType: embed.asset_type,
      name: embed.name,
      order: websiteStack.embeds.length,
      settings: {
        marginTop: '0px',
        marginBottom: '32px',
        width: '100%',
        alignment: 'center',
        padding: '16px'
      }
    };

    setWebsiteStack(prev => ({
      ...prev,
      embeds: [...prev.embeds, newStackedEmbed]
    }));

    setSelectedEmbedId('');
  }, [selectedEmbedId, websiteStack.embeds.length]);

  const removeEmbed = useCallback((embedId: string) => {
    setWebsiteStack(prev => ({
      ...prev,
      embeds: prev.embeds.filter(e => e.id !== embedId).map((e, index) => ({ ...e, order: index }))
    }));
  }, []);

  const generateWebsiteCode = () => {
    const embedCodes = websiteStack.embeds.map(embed => 
      `<div style="margin-top: ${embed.settings.marginTop}; margin-bottom: ${embed.settings.marginBottom}; width: ${embed.settings.width}; text-align: ${embed.settings.alignment}; padding: ${embed.settings.padding};">
  <script src="https://paylift.com/static/embed.js" data-creator-id="creator-1" data-embed-type="${embed.embedType}" data-asset-id="${embed.embedId}"></script>
</div>`
    ).join('\n\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${websiteStack.seoSettings.title}</title>
  <meta name="description" content="${websiteStack.seoSettings.description}">
  <style>
    body {
      font-family: ${websiteStack.globalSettings.fontFamily}, sans-serif;
      background-color: ${websiteStack.globalSettings.backgroundColor};
      margin: 0;
      padding: 0;
      color: #333;
    }
    .container {
      max-width: ${websiteStack.globalSettings.containerWidth};
      margin: 0 auto;
      padding: 0 20px;
    }
  </style>
</head>
<body>
  <div class="container">
${embedCodes}
  </div>
</body>
</html>`;
  };

  const copyWebsiteCode = () => {
    const code = generateWebsiteCode();
    navigator.clipboard.writeText(code);
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
                <h1 className="text-2xl font-bold text-gray-900">Website Builder</h1>
                <p className="text-sm text-gray-600">Stack embeds to create complete websites</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <Eye className="w-4 h-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" onClick={copyWebsiteCode}>
                <Copy className="w-4 h-4 mr-2" />
                Copy Code
              </Button>
              <Button>
                <Save className="w-4 h-4 mr-2" />
                Save Website
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Panel - Settings */}
          <div className="lg:col-span-1 space-y-6">
            {/* Add Embed */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Embed
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Select Embed</Label>
                  <Select value={selectedEmbedId} onValueChange={setSelectedEmbedId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose an embed" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockEmbeds.map((embed) => (
                        <SelectItem key={embed.id} value={embed.id}>
                          {embed.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  className="w-full" 
                  onClick={addEmbed}
                  disabled={!selectedEmbedId}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add to Website
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Area - Website Builder */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Website Structure
                </CardTitle>
              </CardHeader>
              <CardContent>
                {websiteStack.embeds.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Layers className="w-12 h-12 mx-auto mb-4 opacity-30" />
                    <h3 className="text-lg font-medium mb-2">No embeds added yet</h3>
                    <p className="text-sm">Add embeds from the left panel to start building your website</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {websiteStack.embeds.map((embed) => (
                      <div
                        key={embed.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <Move className="w-4 h-4 text-gray-400" />
                            <div>
                              <h4 className="font-medium text-gray-900">{embed.name}</h4>
                              <p className="text-sm text-gray-500">{embed.embedType}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeEmbed(embed.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}