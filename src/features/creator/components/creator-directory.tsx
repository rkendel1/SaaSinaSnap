'use client';

import { useEffect, useState } from 'react';
import { Search, Filter, Grid, List, ExternalLink, Star, Users, Package } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import type { CreatorProfile } from '../types';
import { getAllCreators, type CreatorDirectoryFilters, type CreatorDirectoryResult } from '../controllers/get-all-creators';

interface CreatorDirectoryProps {
  className?: string;
}

type ExtendedCreatorProfile = CreatorProfile & {
  stats?: { products: number; reviews: number; rating: number };
};

const categories = [
  'All Categories',
  'Productivity',
  'Analytics',
  'Marketing',
  'Development Tools',
  'Design',
  'Finance',
  'Communication',
  'E-commerce',
];

const sortOptions = [
  { value: 'featured', label: 'Featured' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
  { value: 'alphabetical', label: 'A-Z' },
];

export function CreatorDirectory({ className }: CreatorDirectoryProps) {
  const [directoryResult, setDirectoryResult] = useState<CreatorDirectoryResult>({
    creators: [],
    total: 0,
    hasMore: false,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [sortBy, setSortBy] = useState<CreatorDirectoryFilters['sortBy']>('featured');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load creators
  const loadCreators = async (filters: CreatorDirectoryFilters = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getAllCreators({
        query: searchQuery || undefined,
        category: selectedCategory !== 'All Categories' ? selectedCategory : undefined,
        sortBy,
        limit: 50,
        offset: 0,
        ...filters,
      });
      
      setDirectoryResult(result);
    } catch (err) {
      console.error('Error loading creators:', err);
      setError('Failed to load creators. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load creators on mount and when filters change
  useEffect(() => {
    loadCreators();
  }, [searchQuery, selectedCategory, sortBy]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== '') {
        loadCreators();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const CreatorCard = ({ creator }: { creator: ExtendedCreatorProfile }) => (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 shadow-md hover:scale-[1.02]">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
              style={{ backgroundColor: creator.brand_color || '#6366f1' }}
            >
              {creator.business_name?.charAt(0) || 'C'}
            </div>
            <div>
              <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                {creator.business_name}
              </CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{creator.stats.rating}</span>
                </div>
                <span className="text-sm text-gray-500">({creator.stats.reviews} reviews)</span>
              </div>
            </div>
          </div>
          <Badge variant="secondary" className="text-xs">
            Featured
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-gray-600 mb-4 line-clamp-2">
          {creator.business_description}
        </CardDescription>
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Package className="w-4 h-4" />
              <span>{creator.stats?.products || 0} products</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{creator.stats?.reviews || 0}+ users</span>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button asChild className="flex-1" size="sm">
            <Link href={`/c/${creator.page_slug}`}>
              View Profile
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link 
              href={creator.business_website || '#'} 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const CreatorListItem = ({ creator }: { creator: ExtendedCreatorProfile }) => (
    <Card className="group hover:shadow-md transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl"
              style={{ backgroundColor: creator.brand_color || '#6366f1' }}
            >
              {creator.business_name?.charAt(0) || 'C'}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-semibold group-hover:text-blue-600 transition-colors mb-1">
                {creator.business_name}
              </h3>
              <p className="text-gray-600 mb-2 line-clamp-1">
                {creator.business_description}
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{creator.stats?.rating?.toFixed(1) || '0.0'}</span>
                  <span>({creator.stats?.reviews || 0} reviews)</span>
                </div>
                <div className="flex items-center gap-1">
                  <Package className="w-4 h-4" />
                  <span>{creator.stats?.products || 0} products</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button asChild size="sm">
              <Link href={`/c/${creator.page_slug}`}>
                View Profile
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link 
                href={creator.business_website || '#'} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={className}>
      {/* Search and Filter Controls */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search creators, products, or descriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48 h-12">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40 h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Showing {directoryResult.creators.length} of {directoryResult.total} creators
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <div className="text-red-400 mb-4">
            <Package className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-red-600 mb-2">Error Loading Creators</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={() => loadCreators()} variant="outline">
            Try Again
          </Button>
        </div>
      ) : directoryResult.creators.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Search className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No creators found</h3>
          <p className="text-gray-500">
            Try adjusting your search or filter criteria
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
        }>
          {directoryResult.creators.map((creator) => (
            <div key={creator.id}>
              {viewMode === 'grid' ? (
                <CreatorCard creator={creator} />
              ) : (
                <CreatorListItem creator={creator} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}