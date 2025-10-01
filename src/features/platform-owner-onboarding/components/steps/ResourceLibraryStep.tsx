'use client';

import { useState } from 'react';
import { ArrowRight, BookOpen, Link as LinkIcon, Plus, Trash2, Video } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { PlatformSettings } from '../../types';

interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'article' | 'video' | 'guide';
}

interface ResourceLibraryStepProps {
  settings: PlatformSettings;
  onNext: () => void;
  onPrevious: () => void;
}

export function ResourceLibraryStep({ settings, onNext, onPrevious }: ResourceLibraryStepProps) {
  const [resources, setResources] = useState<Resource[]>([
    {
      id: '1',
      title: 'Getting Started Guide',
      description: 'Complete guide to setting up your first product',
      url: '/docs/getting-started',
      type: 'guide'
    },
    {
      id: '2',
      title: 'Stripe Connect Setup',
      description: 'How to connect your Stripe account',
      url: '/docs/stripe-setup',
      type: 'video'
    }
  ]);

  const [newResource, setNewResource] = useState<Partial<Resource>>({
    title: '',
    description: '',
    url: '',
    type: 'article'
  });

  const addResource = () => {
    if (newResource.title && newResource.url) {
      setResources([
        ...resources,
        {
          id: Date.now().toString(),
          title: newResource.title,
          description: newResource.description || '',
          url: newResource.url,
          type: newResource.type || 'article'
        }
      ]);
      setNewResource({ title: '', description: '', url: '', type: 'article' });
    }
  };

  const removeResource = (id: string) => {
    setResources(resources.filter(r => r.id !== id));
  };

  const handleSave = async () => {
    // Save resources to platform settings
    console.log('Saving resources:', resources);
    onNext();
  };

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-5 w-5 text-purple-600" />;
      case 'guide':
        return <BookOpen className="h-5 w-5 text-blue-600" />;
      default:
        return <LinkIcon className="h-5 w-5 text-green-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-blue-100 rounded-lg">
          <BookOpen className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Resource Library</h2>
          <p className="text-gray-600">Add helpful resources for creators to access</p>
        </div>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <BookOpen className="h-5 w-5 text-green-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-green-900 mb-1">Support Your Creators</h3>
            <p className="text-sm text-green-700">
              Provide guides, tutorials, and documentation to help creators succeed on your platform.
            </p>
          </div>
        </div>
      </div>

      {/* Existing Resources */}
      <div className="space-y-3">
        <h3 className="font-semibold text-gray-900">Your Resources</h3>
        {resources.map((resource) => (
          <div key={resource.id} className="flex items-start gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="mt-0.5">
              {getResourceIcon(resource.type)}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900">{resource.title}</h4>
              <p className="text-sm text-gray-600 mb-1">{resource.description}</p>
              <p className="text-xs text-gray-500 truncate">{resource.url}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => removeResource(resource.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add New Resource */}
      <div className="border border-gray-300 rounded-lg p-4 space-y-3">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add New Resource
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="resourceTitle">Title</Label>
            <Input
              id="resourceTitle"
              value={newResource.title}
              onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
              placeholder="e.g., Product Setup Guide"
            />
          </div>
          <div>
            <Label htmlFor="resourceType">Type</Label>
            <select
              id="resourceType"
              value={newResource.type}
              onChange={(e) => setNewResource({ ...newResource, type: e.target.value as any })}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="article">Article</option>
              <option value="video">Video</option>
              <option value="guide">Guide</option>
            </select>
          </div>
        </div>

        <div>
          <Label htmlFor="resourceDescription">Description</Label>
          <Input
            id="resourceDescription"
            value={newResource.description}
            onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
            placeholder="Brief description of what this resource covers"
          />
        </div>

        <div>
          <Label htmlFor="resourceUrl">URL</Label>
          <Input
            id="resourceUrl"
            value={newResource.url}
            onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
            placeholder="/docs/guide or https://example.com/tutorial"
          />
        </div>

        <Button onClick={addResource} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Resource
        </Button>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={handleSave}>
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
