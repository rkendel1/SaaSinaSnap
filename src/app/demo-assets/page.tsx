import { FolderOpen } from 'lucide-react';

import { AssetLibraryDemo } from './components/AssetLibraryDemo';

export default function DemoAssetsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container max-w-6xl mx-auto py-8 px-4">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
              <FolderOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Asset Library Demo</h1>
              <p className="text-gray-600">
                Showcase of asset management features
              </p>
            </div>
          </div>
        </div>

        <AssetLibraryDemo />
      </div>
    </div>
  );
}