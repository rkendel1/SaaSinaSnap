'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Code, Eye, ExternalLink, Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { CopyLinkButton } from '@/features/creator/components/copy-link-button';
import { getURL } from '@/utils/get-url';

export default function EmbedPreviewPage() {
  const [embedCode, setEmbedCode] = useState('');
  const previewRef = useRef<HTMLDivElement>(null);

  const handleRenderPreview = () => {
    if (!previewRef.current) return;

    // Clear previous content
    previewRef.current.innerHTML = '';

    if (!embedCode.trim()) {
      toast({
        description: 'Please paste your embed code to preview.',
        variant: 'destructive',
      });
      return;
    }

    // Create a temporary div to parse the HTML string
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = embedCode;

    // Extract the script tag and its attributes
    const scriptTag = tempDiv.querySelector('script[data-product-id][data-embed-type]');
    const divTag = tempDiv.querySelector('div[id^="paylift-embed-"]');

    if (!scriptTag || !divTag) {
      toast({
        description: 'Invalid embed code. Please ensure it contains both the <div> and <script> tags.',
        variant: 'destructive',
      });
      return;
    }

    // Append the div first
    previewRef.current.appendChild(divTag.cloneNode(true));

    // Create a new script element and copy attributes
    const newScript = document.createElement('script');
    Array.from(scriptTag.attributes).forEach(attr => {
      newScript.setAttribute(attr.name, attr.value);
    });
    newScript.async = true; // Ensure async loading

    // Append the new script to the preview area
    previewRef.current.appendChild(newScript);

    toast({
      description: 'Embed preview rendered successfully!',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="mb-8 text-center">
          <Eye className="h-12 w-12 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold mb-2 text-gray-900">Embed Preview</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Paste your generated embed code below to see a live preview of how your product card or checkout button will appear on any website.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Code Input Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Code className="h-5 w-5" />
              Paste Your Embed Code
            </h2>
            <Textarea
              placeholder={`<div id="paylift-embed-card-YOUR_PRODUCT_ID"></div>\n<script src="${getURL()}/static/embed.js" data-product-id="YOUR_PRODUCT_ID" data-creator-id="YOUR_CREATOR_ID" data-embed-type="card" async></script>`}
              value={embedCode}
              onChange={(e) => setEmbedCode(e.target.value)}
              rows={10}
              className="font-mono text-sm border-gray-300 bg-gray-50 text-gray-900 placeholder:text-gray-500"
            />
            <Button onClick={handleRenderPreview} className="w-full">
              Render Preview
            </Button>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-800 text-sm flex items-start gap-2">
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>
                Find your embed codes in the{' '}
                <Link href="/creator/dashboard" className="underline hover:no-underline font-medium">
                  Creator Dashboard &gt; Embed Options
                </Link>
                .
              </p>
            </div>
          </div>

          {/* Live Preview Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Live Preview
            </h2>
            <div className="min-h-[200px] flex items-center justify-center bg-gray-100 border border-gray-200 rounded-md p-4">
              <div ref={previewRef} className="w-full flex justify-center items-center">
                <p className="text-gray-500 text-sm">Your embed will appear here.</p>
              </div>
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-yellow-800 text-sm flex items-start gap-2">
              <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <p>
                This preview simulates an external website. Styling may vary slightly based on your actual site's CSS.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}