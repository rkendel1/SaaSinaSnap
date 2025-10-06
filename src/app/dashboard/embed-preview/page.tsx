'use client';

import { useSearchParams } from 'next/navigation';
import { Eye } from 'lucide-react';

import { EmbedViewer } from '@/components/shared/EmbedViewer';

export default function PlatformOwnerEmbedPreviewPage() {
  const searchParams = useSearchParams();
  const codeParam = searchParams.get('code');
  const initialCode = codeParam ? decodeURIComponent(codeParam) : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50 py-8">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-purple-100 mb-4">
            <Eye className="h-8 w-8 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold mb-3 text-gray-900">Platform Embed Preview Studio</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Test and preview platform-wide embed codes and creator embeds from a single interface.
          </p>
        </div>

        <EmbedViewer initialCode={initialCode} />
      </div>
    </div>
  );
}