'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Edit, Trash2, Copy, Eye, BarChart3, History, Plus, Search } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { EmbedAsset, EmbedAssetType } from '@/features/creator/types/embed-assets';

// Mock data for demonstration
const mockEmbeds: EmbedAsset[] = [
  {
    id: '1',
    creator_id: 'creator-1',
    name: 'Premium Course Card',
    description: 'Product card for premium course offering',
    asset_type: 'product_card',
    embed_config: {
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      accentColor: '#3b82f6',
      borderRadius: '8px'
    },
    preview_url: '/preview/1',
    active: true,
    is_public: true,
    featured: true,
    share_enabled: true,
    view_count: 1245,
    usage_count: 89,
    tags: ['course', 'premium'],
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-20T14:20:00Z'
  },
  {
    id: '2',
    creator_id: 'creator-1',
    name: 'Subscription Button',
    description: 'Monthly subscription checkout button',
    asset_type: 'checkout_button',
    embed_config: {
      backgroundColor: '#ffffff',
      textColor: '#1f2937',
      accentColor: '#10b981',
      borderRadius: '12px'
    },
    preview_url: '/preview/2',
    active: true,
    is_public: false,
    featured: false,
    share_enabled: true,
    view_count: 567,
    usage_count: 34,
    tags: ['subscription'],
    created_at: '2024-01-10T09:15:00Z',
    updated_at: '2024-01-18T11:45:00Z'
  },
  {
    id: '3',
    creator_id: 'creator-1',
    name: 'Hero Banner',
    description: 'Landing page hero section',
    asset_type: 'hero_section',
    embed_config: {
      backgroundColor: '#1f2937',
      textColor: '#ffffff',
      accentColor: '#f97316',
      borderRadius: '0px'
    },
    preview_url: '/preview/3',
    active: false,
    is_public: true,
    featured: false,
    share_enabled: false,
    view_count: 234,
    usage_count: 12,
    tags: ['hero', 'landing'],
    created_at: '2024-01-05T16:20:00Z',
    updated_at: '2024-01-05T16:20:00Z'
  }
];

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

export default function EmbedManagePage() {
  const [embeds, setEmbeds] = useState<EmbedAsset[]>(mockEmbeds);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

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

  const handleDeleteEmbed = (id: string) => {
    setEmbeds(embeds.filter(embed => embed.id !== id));
  };

  const copyEmbedCode = (embed: EmbedAsset) => {
    const embedCode = `<script src="https://paylift.com/embed.js" data-creator-id="${embed.creator_id}" data-embed-type="${embed.asset_type}" data-asset-id="${embed.id}"></script>`;
    navigator.clipboard.writeText(embedCode);
    // You would show a toast notification here
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
                <h1 className="text-2xl font-bold text-gray-900">Embed Management</h1>
                <p className="text-sm text-gray-600">Manage and track your embed assets</p>
              </div>
            </div>
            <Link href="/design-studio/builder">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create New Embed
              </Button>
            </Link>
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
                  <p className="text-2xl font-bold text-gray-900">{embeds.reduce((sum, e) => sum + e.view_count, 0).toLocaleString()}</p>
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
                  <p className="text-2xl font-bold text-gray-900">{embeds.reduce((sum, e) => sum + e.usage_count, 0)}</p>
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
                      <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded"></div>
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
                        <span>{embed.view_count.toLocaleString()} views</span>
                        <span>{embed.usage_count} conversions</span>
                        <span>Updated {new Date(embed.updated_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => copyEmbedCode(embed)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <BarChart3 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <History className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteEmbed(embed.id)}
                      className="text-red-600 hover:text-red-700"
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
    </div>
  );
}