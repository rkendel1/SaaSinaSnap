'use client';

import React, { useState, useMemo } from 'react';
import { Search, HelpCircle, Book, Video, MessageCircle, ExternalLink, ArrowRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Button } from './button';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Input } from './input';
import { Badge } from './badge';

export interface HelpArticle {
  id: string;
  title: string;
  description: string;
  category: 'getting-started' | 'products' | 'billing' | 'analytics' | 'troubleshooting' | 'advanced';
  type: 'article' | 'video' | 'guide' | 'faq';
  url: string;
  estimatedTime?: string;
  tags: string[];
  popular?: boolean;
}

export interface HelpCenterProps {
  className?: string;
  compact?: boolean;
  showCategories?: boolean;
  initialCategory?: string;
  onArticleClick?: (article: HelpArticle) => void;
}

const helpArticles: HelpArticle[] = [
  {
    id: 'getting-started',
    title: 'Getting Started with Your Creator Account',
    description: 'Learn the basics of setting up your creator profile and first product',
    category: 'getting-started',
    type: 'guide',
    url: '/help/getting-started',
    estimatedTime: '5 min',
    tags: ['onboarding', 'setup', 'profile'],
    popular: true,
  },
  {
    id: 'create-product',
    title: 'How to Create Your First Product',
    description: 'Step-by-step guide to adding products and setting up pricing',
    category: 'products',
    type: 'video',
    url: '/help/create-product',
    estimatedTime: '8 min',
    tags: ['products', 'pricing', 'setup'],
    popular: true,
  },
  {
    id: 'embed-widgets',
    title: 'Embedding Widgets on Your Website',
    description: 'Learn how to generate and embed product widgets anywhere',
    category: 'products',
    type: 'guide',
    url: '/help/embed-widgets',
    estimatedTime: '10 min',
    tags: ['embeds', 'widgets', 'integration'],
  },
  {
    id: 'stripe-setup',
    title: 'Setting Up Stripe Connect',
    description: 'Configure payment processing and connect your Stripe account',
    category: 'billing',
    type: 'article',
    url: '/help/stripe-setup',
    estimatedTime: '12 min',
    tags: ['stripe', 'payments', 'billing'],
  },
  {
    id: 'analytics-dashboard',
    title: 'Understanding Your Analytics',
    description: 'Learn how to read and use your revenue and performance analytics',
    category: 'analytics',
    type: 'guide',
    url: '/help/analytics-dashboard',
    estimatedTime: '6 min',
    tags: ['analytics', 'revenue', 'metrics'],
  },
  {
    id: 'troubleshooting-checkout',
    title: 'Troubleshooting Checkout Issues',
    description: 'Common solutions for payment and checkout problems',
    category: 'troubleshooting',
    type: 'faq',
    url: '/help/troubleshooting-checkout',
    estimatedTime: '3 min',
    tags: ['checkout', 'payments', 'troubleshooting'],
  },
  {
    id: 'custom-domains',
    title: 'Setting Up Custom Domains',
    description: 'Configure your own domain for your branded storefront',
    category: 'advanced',
    type: 'article',
    url: '/help/custom-domains',
    estimatedTime: '15 min',
    tags: ['domains', 'branding', 'dns'],
  },
];

const categoryNames = {
  'getting-started': 'Getting Started',
  'products': 'Products & Pricing',
  'billing': 'Billing & Payments',
  'analytics': 'Analytics & Reports',
  'troubleshooting': 'Troubleshooting',
  'advanced': 'Advanced Features',
};

const typeIcons = {
  article: Book,
  video: Video,
  guide: HelpCircle,
  faq: MessageCircle,
};

export function HelpCenter({
  className,
  compact = false,
  showCategories = true,
  initialCategory,
  onArticleClick,
}: HelpCenterProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory || null);

  const filteredArticles = useMemo(() => {
    let filtered = helpArticles;

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter(article => article.category === selectedCategory);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(article =>
        article.title.toLowerCase().includes(query) ||
        article.description.toLowerCase().includes(query) ||
        article.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [searchQuery, selectedCategory]);

  const popularArticles = helpArticles.filter(article => article.popular);

  const handleArticleClick = (article: HelpArticle) => {
    if (onArticleClick) {
      onArticleClick(article);
    } else {
      window.open(article.url, '_blank');
    }
  };

  if (compact) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-blue-600" />
            Quick Help
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {popularArticles.slice(0, 3).map((article) => {
            const IconComponent = typeIcons[article.type];
            return (
              <button
                key={article.id}
                onClick={() => handleArticleClick(article)}
                className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <IconComponent className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-gray-900 line-clamp-1">
                    {article.title}
                  </h4>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {article.description}
                  </p>
                </div>
                <ArrowRight className="h-3 w-3 text-gray-400 flex-shrink-0" />
              </button>
            );
          })}
          <Button variant="outline" size="sm" className="w-full">
            View All Help Articles
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Help Center</h2>
        <p className="text-gray-600">
          Find answers, guides, and resources to help you succeed
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search help articles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Categories */}
      {showCategories && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
          >
            All
          </Button>
          {Object.entries(categoryNames).map(([key, name]) => (
            <Button
              key={key}
              variant={selectedCategory === key ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(key)}
            >
              {name}
            </Button>
          ))}
        </div>
      )}

      {/* Popular Articles (if no search/filter) */}
      {!searchQuery && !selectedCategory && (
        <div>
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <span>Popular Articles</span>
            <Badge variant="secondary">Most Helpful</Badge>
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {popularArticles.map((article) => {
              const IconComponent = typeIcons[article.type];
              return (
                <Card
                  key={article.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handleArticleClick(article)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <IconComponent className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {article.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {article.description}
                        </p>
                        <div className="flex items-center gap-2">
                          {article.estimatedTime && (
                            <Badge variant="outline" className="text-xs">
                              {article.estimatedTime}
                            </Badge>
                          )}
                          <ExternalLink className="h-3 w-3 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Filtered Articles */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">
          {searchQuery
            ? `Search Results (${filteredArticles.length})`
            : selectedCategory
            ? categoryNames[selectedCategory as keyof typeof categoryNames]
            : 'All Articles'
          }
        </h3>
        
        {filteredArticles.length === 0 ? (
          <div className="text-center py-8">
            <HelpCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No articles found</p>
            <Button
              variant="link"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
              }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredArticles.map((article) => {
              const IconComponent = typeIcons[article.type];
              return (
                <Card
                  key={article.id}
                  className="cursor-pointer hover:shadow-sm transition-shadow"
                  onClick={() => handleArticleClick(article)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <IconComponent className="h-4 w-4 text-gray-400 mt-1 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {article.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {article.description}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {categoryNames[article.category]}
                          </Badge>
                          {article.estimatedTime && (
                            <Badge variant="secondary" className="text-xs">
                              {article.estimatedTime}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Contact Support */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4 text-center">
          <MessageCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <h3 className="font-semibold text-blue-900 mb-1">Still need help?</h3>
          <p className="text-sm text-blue-700 mb-3">
            Our support team is here to help you succeed
          </p>
          <Button variant="outline" size="sm">
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}