'use client';

import { useEffect, useRef, useState } from 'react';
import { Copy, Eye, Info } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { getURL } from '@/utils/get-url';

interface EmbedViewerProps {
  initialCode?: string;
  showCopyButton?: boolean;
  showInstructions?: boolean;
}

export function EmbedViewer({ initialCode = '', showCopyButton = true, showInstructions = true }: EmbedViewerProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [embedCode, setEmbedCode] = useState(initialCode);

  // Maximum number of retry attempts for script loading
  const MAX_RETRIES = 3;
  // Timeout for script loading (in milliseconds)
  const SCRIPT_TIMEOUT = 5000;

  // Function to validate embed code structure
  const validateEmbedCode = (code: string) => {
    const errors: string[] = [];
    
    if (!code.includes('script')) {
      errors.push('Embed code must contain a <script> tag');
      return errors;
    }

    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = code;

    const scriptTag = tempDiv.querySelector('script[data-creator-id]');
    if (!scriptTag) {
      errors.push('Script tag must include data-creator-id attribute');
    }

    const embedType = scriptTag?.getAttribute('data-embed-type');
    if (!embedType) {
      errors.push('Script tag must include data-embed-type attribute');
    }

    // Validate required attributes based on embed type
    if (embedType === 'product_card' || embedType === 'checkout_button') {
      if (!scriptTag?.getAttribute('data-product-id')) {
        errors.push(`${embedType} requires data-product-id attribute`);
      }
    }

    return errors;
  };

  // Function to clean up previous embed instances
  const cleanupPreviousEmbed = () => {
    if (!previewRef.current) return;

    // Remove all script tags
    const scripts = previewRef.current.getElementsByTagName('script');
    Array.from(scripts).forEach(script => {
      script.remove();
    });

    // Remove all embed containers
    const embeds = previewRef.current.querySelectorAll('[id^="saasinasnap-embed-"]');
    embeds.forEach(embed => embed.remove());

    // Clear any remaining content
    previewRef.current.innerHTML = '';
  };

  // Function to load script with retry mechanism
  const loadScriptWithRetry = async (
    scriptElement: HTMLScriptElement,
    retryCount = 0
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout;

      const cleanup = () => {
        scriptElement.onload = null;
        scriptElement.onerror = null;
        clearTimeout(timeoutId);
      };

      scriptElement.onload = () => {
        cleanup();
        resolve();
      };

      scriptElement.onerror = async () => {
        cleanup();
        if (retryCount < MAX_RETRIES) {
          try {
            await loadScriptWithRetry(scriptElement, retryCount + 1);
            resolve();
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error(`Failed to load script after ${MAX_RETRIES} attempts`));
        }
      };

      // Set timeout
      timeoutId = setTimeout(() => {
        cleanup();
        if (retryCount < MAX_RETRIES) {
          loadScriptWithRetry(scriptElement, retryCount + 1)
            .then(resolve)
            .catch(reject);
        } else {
          reject(new Error('Script loading timed out'));
        }
      }, SCRIPT_TIMEOUT);

      // Append script to trigger loading
      previewRef.current?.appendChild(scriptElement);
    });
  };

  const handleRenderPreview = async () => {
    if (!previewRef.current || !textareaRef.current) return;

    const code = textareaRef.current.value;

    if (!code.trim()) {
      toast({
        description: 'Please paste your embed code to preview.',
        variant: 'destructive',
      });
      return;
    }

    // Validate embed code
    const validationErrors = validateEmbedCode(code);
    if (validationErrors.length > 0) {
      toast({
        description: validationErrors.join('\n'),
        variant: 'destructive',
      });
      return;
    }

    // Clean up previous embed
    cleanupPreviousEmbed();

    // Show loading state
    previewRef.current.innerHTML = `
      <div class="flex items-center justify-center p-8 text-gray-500">
        <svg class="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Loading preview...
      </div>
    `;

    try {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = code;

      const scriptTag = tempDiv.querySelector('script[data-creator-id]');
      const divTag = tempDiv.querySelector('div[id^="saasinasnap-embed-"]');
      
      if (!scriptTag) throw new Error('Script tag not found in embed code');

      // Clear loading state
      previewRef.current.innerHTML = '';

      // If there's a div tag, append it first
      if (divTag) {
        previewRef.current.appendChild(divTag.cloneNode(true));
      }

      // Create and configure new script
      const newScript = document.createElement('script');
      Array.from(scriptTag.attributes).forEach(attr => {
        if (attr.name === 'src') {
          try {
            const url = new URL(attr.value, window.location.origin);
            url.searchParams.set('t', new Date().getTime().toString());
            newScript.setAttribute(attr.name, url.toString());
          } catch (e) {
            newScript.setAttribute(attr.name, attr.value);
          }
        } else {
          newScript.setAttribute(attr.name, attr.value);
        }
      });
      newScript.async = true;

      // Load script with retry mechanism
      await loadScriptWithRetry(newScript);

      toast({
        description: 'Embed preview rendered successfully!',
      });
    } catch (error: unknown) {
      console.error('Error rendering preview:', error);
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'An unexpected error occurred';
      
      previewRef.current.innerHTML = `
        <div class="p-4 text-red-800 bg-red-50 border-2 border-red-200 rounded-lg">
          <p class="font-semibold mb-2">Error rendering preview:</p>
          <p class="text-sm">${errorMessage}</p>
        </div>
      `;

      toast({
        description: 'Failed to render preview. Please check console for details.',
        variant: 'destructive',
      });
    }
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

  // Auto-render initial code if provided
  useEffect(() => {
    if (initialCode) {
      setEmbedCode(initialCode);
      setTimeout(() => {
        handleRenderPreview();
      }, 500);
    }
  }, [handleRenderPreview, initialCode]);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Code Input Section */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-600" />
            Paste Your Embed Code
          </h2>
          {showCopyButton && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleCopyCode}
              className="gap-2"
            >
              <Copy className="h-4 w-4" />
              Copy
            </Button>
          )}
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
        {showInstructions && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 text-sm flex items-start gap-3">
            <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium mb-1">Instructions:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>Paste your embed code in the text area above</li>
                <li>Click "Render Preview" to see how it will look</li>
                <li>The preview shows exactly how it will appear on your site</li>
              </ul>
            </div>
          </div>
        )}
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
  );
}