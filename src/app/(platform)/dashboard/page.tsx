import Link from 'next/link';
import { DollarSign, Eye,Users } from 'lucide-react';

import { Button } from '@/components/ui/button';

export default function PlatformDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Platform Dashboard</h1>
          <p className="text-gray-600">Manage your entire platform, creators, and products from here.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold mb-4 text-gray-900 flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Manage Platform Products
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Add, edit, and archive the subscription plans you offer to your creators.
            </p>
            <Button asChild>
              <Link href="/dashboard/products">Manage Products</Link>
            </Button>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold mb-4 text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Manage Creators
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              View and manage all the creators who have signed up on your platform.
            </p>
            <Button variant="outline" disabled>
              View Creators (Coming Soon)
            </Button>
          </div>
        </div>

        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-gray-900">Preview Your Embeds</h3>
              <p className="text-sm text-gray-600 mt-1">
                Test how your platform's product cards and checkout buttons will look on any website.
              </p>
            </div>
            <Button asChild variant="outline">
              <Link href="/embed-preview">
                <Eye className="h-4 w-4 mr-2" />
                Open Previewer
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}