'use client';

import Link from 'next/link';
import { ArrowRight, Layout, Palette, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PlatformStorefrontPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border shadow-sm mb-6">
            <Layout className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-gray-700">Platform Storefront</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Customize Your Platform
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Design and customize your platform's appearance and branding.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Link href="/dashboard/storefront/customize">
            <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-0 bg-white/60 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-500/20 transition-colors">
                  <Palette className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Customize Appearance</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Brand colors, logos, and styling</CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/storefront/templates">
            <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-0 bg-white/60 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-pink-500/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-pink-500/20 transition-colors">
                  <Sparkles className="w-6 h-6 text-pink-600" />
                </div>
                <CardTitle className="text-lg">Browse Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Professional pre-designed themes</CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Main CTA */}
        <div className="text-center">
          <Link href="/dashboard/storefront/customize">
            <Button size="lg" className="px-8 py-4 text-lg">
              Start Customizing
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-white/60 backdrop-blur-sm rounded-lg border p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Platform Storefront Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🎨 Visual Customization</h3>
              <p className="text-gray-600">
                Customize colors, fonts, and layouts to match your brand identity.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">📱 Responsive Design</h3>
              <p className="text-gray-600">
                All customizations work seamlessly across desktop, tablet, and mobile.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">🚀 Quick Setup</h3>
              <p className="text-gray-600">
                Start with templates and customize them to your needs in minutes.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">✨ Premium Templates</h3>
              <p className="text-gray-600">
                Access professionally designed templates for various industries.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
