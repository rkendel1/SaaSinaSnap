'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Code, Copy, Eye, Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { getURL } from '@/utils/get-url';

export default function EmbedPreviewPage() {
  const previewRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [embedCode, setEmbedCode] = useState('');
  const searchParams = useSearchParams();

  // Pre-fill embed code from URL query parameter
  useEffect(() => {
    const codeParam = searchParams.get('code');
    if (codeParam) {
      const decodedCode = decodeURIComponent(codeParam);
      setEmbedCode(decodedCode);
      if (textareaRef.current) {
        textareaRef.current.value = decodedCode;
      }
      // Auto-render if code is provided via URL
      setTimeout(() => {
        handleRenderPreview();
      }, 500);
    }
  }, [searchParams]);

  const handleRenderPreview = () => {
    if (!previewRef.current || !textareaRef.current) return;

    const embedCode = textareaRef.current.value;
    previewRef.current.innerHTML = '';

    if (!embedCode.trim()) {
      toast({
        description: 'Please paste your embed code to preview.',
        variant: 'destructive',
      });
      return;
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = embedCode;

    const scriptTag = tempDiv.querySelector('script[data-creator-id]');
    
    // Support both old format (div + script) and new format (script only)
    const divTag = tempDiv.querySelector('div[id^="saasinasnap-embed-"]');

    if (!scriptTag) {
      toast({
        description: 'Invalid embed code. Please ensure it contains the embed <script> tag.',
        variant: 'destructive',
      });
      return;
    }

    // If there's a div tag, append it first
    if (divTag) {
      previewRef.current.appendChild(divTag.cloneNode(true));
    }

    const newScript = document.createElement('script');
    Array.from(scriptTag.attributes).forEach(attr => {
      if (attr.name === 'src') {
        // Add a cache-busting query parameter to the script URL
        try {
          const url = new URL(attr.value, window.location.origin);
          url.searchParams.set('t', new Date().getTime().toString());
          newScript.setAttribute(attr.name, url.toString());
        } catch (e) {
          // Fallback for invalid URLs, though unlikely
          newScript.setAttribute(attr.name, attr.value);
        }
      } else {
        newScript.setAttribute(attr.name, attr.value);
      }
    });
    newScript.async = true;

    previewRef.current.appendChild(newScript);

    toast({
      description: 'Embed preview rendered successfully!',
    });
  };

  const handleCopyCode = () => {
    if (!textareaRef.current?.value) {
      toast({
        description: 'No embed code to copy.',
        variant: 'destructive',
      });
      return;
    }
    
    navigator.clipboard.writeText(textareaRef.current.value);
    toast({
      description: 'Embed code copied to clipboard!',
    });
  };

  const handleClearPreview = () => {
    if (previewRef.current) {
      previewRef.current.innerHTML = '<p class="text-gray-500 text-sm">Your embed will appear here.</p>';
    }
    if (textareaRef.current) {
      textareaRef.current.value = '';
      setEmbedCode('');
    }
    toast({
      description: 'Preview cleared.',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
            <Eye className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold mb-3 text-gray-900">Embed Preview Studio</h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            Paste your generated embed code below to see a live preview of how it will appear on your website.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Code Input Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Code className="h-5 w-5 text-blue-600" />
                Paste Your Embed Code
              </h2>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopyCode}
                className="gap-2"
              >
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
            <Textarea
              ref={textareaRef}
              value={embedCode}
              onChange={(e) => setEmbedCode(e.target.value)}
              placeholder={`<!-- Paste your embed code here -->\n<script src="${getURL()}/static/embed.js" data-creator-id="..." data-embed-type="..." async></script>`}
              rows={10}
              className="font-mono text-sm border-gray-300 bg-gray-50 text-gray-900 placeholder:text-gray-500 resize-none"
            />
            <div className="flex gap-2">
              <Button onClick={handleRenderPreview} className="flex-1 gap-2">
                <Eye className="h-4 w-4" />
                Render Preview
              </Button>
              <Button 
                onClick={handleClearPreview} 
                variant="outline" 
                className="gap-2"
              >
                Clear
              </Button>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 text-sm flex items-start gap-3">
              <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-medium">Where to find embed codes:</p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>
                    <Link href="/creator/dashboard/products" className="underline hover:no-underline font-medium">
                      Products Dashboard
                    </Link> - for product embeds
                  </li>
                  <li>
                    <Link href="/creator/design-studio" className="underline hover:no-underline font-medium">
                      Design Studio
                    </Link> - for custom embeds
                  </li>
                  <li>
                    <Link href="/dashboard/design-studio/manage" className="underline hover:no-underline font-medium">
                      Platform Design Studio
                    </Link> - for platform assets
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Live Preview Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Eye className="h-5 w-5 text-green-600" />
              Live Preview
            </h2>
            <div className="min-h-[400px] flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-6">
              <div ref={previewRef} className="w-full flex justify-center items-center">
                <p className="text-gray-500 text-sm">Your embed will appear here.</p>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800 text-sm flex items-start gap-3">
              <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium mb-1">Preview Notes:</p>
                <ul className="list-disc list-inside space-y-1 text-amber-700">
                  <li>This simulates how the embed appears on external websites</li>
                  <li>Actual styling may vary based on the host page's CSS</li>
                  <li>Interactive features will work as they would on your site</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <Link 
              href="/creator/design-studio" 
              className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <Code className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Create New Embed</div>
                <div className="text-sm text-gray-600">Design custom embeds</div>
              </div>
            </Link>
            <Link 
              href="/creator/dashboard/products" 
              className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-green-500 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <Code className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Product Embeds</div>
                <div className="text-sm text-gray-600">View product codes</div>
              </div>
            </Link>
            <Link 
              href="/dashboard/design-studio/manage" 
              className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 hover:border-purple-500 transition-colors group"
            >
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Code className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="font-medium text-gray-900">Platform Assets</div>
                <div className="text-sm text-gray-600">Manage platform embeds</div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}