'use client';

import { useCallback,useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Copy,Eye, Layers, Move, Palette, Plus, Save, Settings, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

interface StackedEmbed {
  id: string;
  embedId: string;
  embedType: string;
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

// Design tokens for consistent styling
const designTokens = {
  colors: {
    primary: '#3b82f6',
    secondary: '#64748b',
    accent: '#f59e0b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    neutral: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a'
    }
  },
  spacing: {
    xs: '0.5rem',
    sm: '1rem',
    md: '1.5rem',
    lg: '2rem',
    xl: '3rem',
    xxl: '4rem'
  },
  typography: {
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem'
    },
    fontWeights: {
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700'
    }
  },
  borderRadius: {
    sm: '0.125rem',
    base: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    full: '9999px'
  },
  shadows: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    base: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)'
  }
};

// Mock embed assets
const mockEmbeds = [
  {
    id: '1',
    name: 'Hero Banner',
    asset_type: 'hero_banner',
  },
  {
    id: '2',
    name: 'Pricing Cards',
    asset_type: 'pricing_cards',
  },
  {
    id: '3',
    name: 'Testimonials',
    asset_type: 'testimonial_section',
  }
];

export default function WebsiteBuilderDemoPage() {
  const [websiteStack, setWebsiteStack] = useState<WebsiteStack>({
    id: '1',
    name: 'My Demo Website',
    description: 'A sample website built with our builder',
    embeds: [],
    globalSettings: {
      fontFamily: 'Inter',
      primaryColor: designTokens.colors.primary,
      backgroundColor: designTokens.colors.neutral[50],
      containerWidth: '1200px'
    },
    seoSettings: {
      title: 'Demo Website',
      description: 'Built with SaaSinaSnap Website Builder',
      keywords: ['demo', 'website', 'builder']
    }
  });

  const [selectedEmbedId, setSelectedEmbedId] = useState<string>('');

  const addEmbed = useCallback(() => {
    if (!selectedEmbedId) return;

    const embed = mockEmbeds.find(e => e.id === selectedEmbedId);
    if (!embed) return;

    const newEmbed: StackedEmbed = {
      id: `embed-${Date.now()}`,
      embedId: embed.id,
      embedType: embed.asset_type,
      name: embed.name,
      order: websiteStack.embeds.length,
      settings: {
        marginTop: '1rem',
        marginBottom: '1rem',
        width: '100%',
        alignment: 'center',
        backgroundColor: 'transparent',
        padding: '1rem'
      }
    };

    setWebsiteStack(prev => ({
      ...prev,
      embeds: [...prev.embeds, newEmbed]
    }));

    setSelectedEmbedId('');
  }, [selectedEmbedId, websiteStack.embeds.length]);

  const removeEmbed = useCallback((embedId: string) => {
    setWebsiteStack(prev => ({
      ...prev,
      embeds: prev.embeds.filter(embed => embed.id !== embedId)
    }));
  }, []);

  const generateWebsiteCode = () => {
    const embedCodes = websiteStack.embeds.map(embed => 
      `    <div class="embed-container" data-embed-type="${embed.embedType}">
      <!-- ${embed.name} would be rendered here -->
      <div class="placeholder-embed">${embed.name}</div>
    </div>`
    ).join('\n');

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
    }
    .container {
      max-width: ${websiteStack.globalSettings.containerWidth};
      margin: 0 auto;
      padding: 2rem;
    }
    .embed-container {
      margin: 1rem 0;
      padding: 1rem;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
    }
    .placeholder-embed {
      padding: 2rem;
      text-align: center;
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      border-radius: 0.25rem;
      color: #6b7280;
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
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Website Builder Demo</h1>
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

            {/* Design Tokens Panel */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Design Tokens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="colors" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="colors">Colors</TabsTrigger>
                    <TabsTrigger value="spacing">Spacing</TabsTrigger>
                    <TabsTrigger value="typography">Type</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="colors" className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium">Primary Colors</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded border border-gray-200"
                            style={{ backgroundColor: designTokens.colors.primary }}
                          />
                          <span className="text-xs">Primary</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded border border-gray-200"
                            style={{ backgroundColor: designTokens.colors.secondary }}
                          />
                          <span className="text-xs">Secondary</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded border border-gray-200"
                            style={{ backgroundColor: designTokens.colors.accent }}
                          />
                          <span className="text-xs">Accent</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded border border-gray-200"
                            style={{ backgroundColor: designTokens.colors.success }}
                          />
                          <span className="text-xs">Success</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Neutral Scale</Label>
                      <div className="flex gap-1 mt-1">
                        {Object.entries(designTokens.colors.neutral).slice(0, 5).map(([key, value]) => (
                          <div 
                            key={key}
                            className="w-3 h-6 rounded-sm border border-gray-200"
                            style={{ backgroundColor: value }}
                            title={`${key}: ${value}`}
                          />
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="spacing" className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium">Spacing Scale</Label>
                      <div className="space-y-2 mt-1">
                        {Object.entries(designTokens.spacing).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-xs font-mono">{key}</span>
                            <span className="text-xs text-gray-500">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="typography" className="space-y-3">
                    <div>
                      <Label className="text-xs font-medium">Font Sizes</Label>
                      <div className="space-y-1 mt-1">
                        {Object.entries(designTokens.typography.fontSizes).slice(0, 4).map(([key, value]) => (
                          <div key={key} className="flex items-center justify-between">
                            <span className="text-xs font-mono">{key}</span>
                            <span className="text-xs text-gray-500">{value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-medium">Shadows</Label>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        {Object.entries(designTokens.shadows).slice(0, 4).map(([key, value]) => (
                          <div 
                            key={key}
                            className="w-8 h-6 bg-white rounded border"
                            style={{ boxShadow: value }}
                            title={`${key}: ${value}`}
                          />
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
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