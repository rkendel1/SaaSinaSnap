'use client';

import Link from 'next/link';
import { ArrowLeft, FlaskConical, TrendingUp, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function PlatformTestingPage() {
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
            <FlaskConical className="w-5 h-5 text-orange-600" />
            <span className="text-sm font-medium text-gray-700">A/B Testing</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Optimize Platform Performance
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl leading-relaxed">
            Test different variations of your embeds and landing pages to maximize conversion rates.
          </p>
        </div>

        {/* Testing Tools */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center mb-3">
                <FlaskConical className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle>Create A/B Test</CardTitle>
              <CardDescription>
                Set up experiments to compare different embed designs
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
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle>View Test Results</CardTitle>
              <CardDescription>
                Analyze performance metrics and winner selection
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
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle>Audience Segments</CardTitle>
              <CardDescription>
                Target specific user groups with tailored variations
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">About A/B Testing</h2>
          <p className="text-gray-600 mb-4">
            A/B testing allows you to compare different versions of your embeds to see which performs better.
            This feature will help you make data-driven decisions to optimize conversion rates and user engagement.
          </p>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Test different designs, colors, and layouts</li>
            <li>Measure conversion rates and engagement metrics</li>
            <li>Automatically deploy winning variations</li>
            <li>Target specific audience segments</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
