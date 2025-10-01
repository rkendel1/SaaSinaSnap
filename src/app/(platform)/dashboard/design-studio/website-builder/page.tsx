'use client';

import Link from 'next/link';
import { ArrowLeft, Eye, Layers, Layout, Smartphone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PlatformWebsiteBuilderPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/design-studio">
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Design Studio
            </Button>
          </Link>
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border shadow-sm mb-6">
            <Eye className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-700">Website Builder</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Build Complete Websites
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl leading-relaxed">
            Stack and arrange embeds to create full-featured websites for your platform.
          </p>
        </div>

        {/* Builder Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-3">
                <Layout className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Page Builder</CardTitle>
              <CardDescription>
                Drag and drop embeds to create custom page layouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-3">
                <Layers className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>Template Library</CardTitle>
              <CardDescription>
                Start with pre-designed templates and customize
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-3">
                <Smartphone className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle>Responsive Design</CardTitle>
              <CardDescription>
                Preview and optimize for all device sizes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Information Section */}
        <div className="mt-12 bg-white/60 backdrop-blur-sm rounded-lg border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About Website Builder</h2>
          <p className="text-gray-600 mb-4">
            The Website Builder allows you to create complete, professional websites by combining your embeds
            into cohesive layouts. Perfect for building landing pages, product showcases, and more.
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Drag and drop interface for easy composition</li>
            <li>Responsive design that works on all devices</li>
            <li>Pre-built templates to get started quickly</li>
            <li>Full customization of colors, fonts, and spacing</li>
            <li>SEO optimization and performance tuning</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
