'use client';

import Link from 'next/link';
import { ArrowLeft, Palette, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function PlatformStorefrontCustomizePage() {
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Customize Appearance</h1>
              <p className="text-gray-600 mt-1">Personalize your platform's look and feel</p>
            </div>
            <Button size="lg">
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Customization Panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Settings Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Brand Colors
                </CardTitle>
                <CardDescription>Set your primary and accent colors</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex gap-2 mt-2">
                    <Input type="color" id="primary-color" defaultValue="#ea580c" className="w-20" />
                    <Input type="text" value="#ea580c" readOnly />
                  </div>
                </div>
                <div>
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex gap-2 mt-2">
                    <Input type="color" id="secondary-color" defaultValue="#0ea5e9" className="w-20" />
                    <Input type="text" value="#0ea5e9" readOnly />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Typography</CardTitle>
                <CardDescription>Choose fonts for your platform</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="heading-font">Heading Font</Label>
                  <Input id="heading-font" value="Inter" readOnly className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="body-font">Body Font</Label>
                  <Input id="body-font" value="Inter" readOnly className="mt-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Logo</CardTitle>
                <CardDescription>Upload your platform logo</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline" disabled>
                  Upload Logo
                </Button>
                <p className="text-xs text-gray-500 mt-2">Recommended: 200x200px PNG</p>
              </CardContent>
            </Card>
          </div>

          {/* Preview */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>See how your changes look in real-time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 rounded-lg p-8 min-h-[600px] border">
                  <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-900 mb-4">Welcome to Your Platform</h2>
                    <p className="text-gray-600 mb-6">
                      This is a preview of how your customizations will appear to users.
                    </p>
                    <div className="space-y-4">
                      <Button className="w-full bg-[#ea580c] hover:bg-[#ea580c]/90">
                        Primary Button
                      </Button>
                      <Button variant="outline" className="w-full">
                        Secondary Button
                      </Button>
                    </div>
                    <div className="mt-8 pt-8 border-t">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Sample Content</h3>
                      <p className="text-gray-600">
                        Your custom branding will be applied throughout the platform interface.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
