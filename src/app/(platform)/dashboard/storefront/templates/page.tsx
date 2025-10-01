'use client';

import Link from 'next/link';
import { ArrowLeft, Check, Sparkles } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const templates = [
  {
    id: 'modern',
    name: 'Modern SaaS',
    description: 'Clean, professional design perfect for modern SaaS platforms',
    preview: '/api/placeholder/400/300',
    features: ['Dark mode', 'Gradient accents', 'Modern typography'],
    popular: true,
  },
  {
    id: 'minimal',
    name: 'Minimalist',
    description: 'Simple, elegant design focusing on content',
    preview: '/api/placeholder/400/300',
    features: ['Light colors', 'Simple layouts', 'Clear hierarchy'],
    popular: false,
  },
  {
    id: 'bold',
    name: 'Bold & Creative',
    description: 'Eye-catching design with vibrant colors',
    preview: '/api/placeholder/400/300',
    features: ['Vibrant colors', 'Dynamic layouts', 'Creative elements'],
    popular: true,
  },
  {
    id: 'corporate',
    name: 'Corporate',
    description: 'Professional design for enterprise platforms',
    preview: '/api/placeholder/400/300',
    features: ['Classic look', 'Trust-building', 'Professional'],
    popular: false,
  },
];

export default function PlatformStorefrontTemplatesPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/storefront">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Storefront
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Browse Templates</h1>
          <p className="text-gray-600 mt-1">Choose a professional template to get started quickly</p>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="overflow-hidden">
              <div className="relative">
                {/* Template Preview Placeholder */}
                <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <Sparkles className="w-12 h-12 text-purple-600 opacity-50" />
                </div>
                {template.popular && (
                  <Badge className="absolute top-4 right-4 bg-orange-500">Popular</Badge>
                )}
              </div>
              <CardHeader>
                <CardTitle>{template.name}</CardTitle>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Features:</p>
                  <ul className="space-y-1">
                    {template.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2">
                <Button className="flex-1" disabled>
                  Preview
                </Button>
                <Button className="flex-1" variant="outline" disabled>
                  Apply
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-white rounded-lg border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About Templates</h2>
          <p className="text-gray-600 mb-4">
            Our professional templates are designed to give your platform a polished look right out of the box.
            Each template is fully customizable, so you can adjust colors, fonts, and layouts to match your brand.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">✨ Professional Design</h3>
              <p className="text-sm text-gray-600">
                Created by experienced designers
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🎨 Fully Customizable</h3>
              <p className="text-sm text-gray-600">
                Adjust every aspect to match your brand
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">📱 Responsive</h3>
              <p className="text-sm text-gray-600">
                Works perfectly on all devices
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
