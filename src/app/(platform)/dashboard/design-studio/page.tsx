'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Eye, FlaskConical, Palette, Settings, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PlatformDesignStudioPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border shadow-sm mb-6">
            <Palette className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-gray-700">Platform Design Studio</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Build Beautiful Embeds
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Create and customize embeddable components for your platform with AI-powered design assistance.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Link href="/dashboard/design-studio/builder">
            <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-0 bg-white/60 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-500/20 transition-colors">
                  <Zap className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle className="text-lg">Quick Create</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Start with AI-powered templates</CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/design-studio/manage">
            <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-0 bg-white/60 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-500/20 transition-colors">
                  <Settings className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-lg">Asset Library</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Manage embeds, preview & copy codes</CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/design-studio/website-builder">
            <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-0 bg-white/60 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-green-500/20 transition-colors">
                  <Eye className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-lg">Website Builder</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Stack embeds to build full websites</CardDescription>
              </CardContent>
            </Card>
          </Link>

          <Link href="/dashboard/design-studio/testing">
            <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-0 bg-white/60 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-3 group-hover:bg-orange-500/20 transition-colors">
                  <FlaskConical className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle className="text-lg">A/B Testing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>Optimize performance</CardDescription>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Main CTA */}
        <div className="text-center">
          <Link href="/dashboard/design-studio/builder">
            <Button size="lg" className="px-8 py-4 text-lg">
              Start Building
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
