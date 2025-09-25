'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, ExternalLink, Globe, Info, Loader2, Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import type { CreatorProfile } from '@/features/creator-onboarding/types';
import { getURL } from '@/utils/get-url';

import { updateCreatorPageSlugAction } from '../actions/profile-actions';

interface CustomDomainGuideProps {
  creatorProfile: CreatorProfile;
}

export function CustomDomainGuide({ creatorProfile }: CustomDomainGuideProps) {
  const [customSlug, setCustomSlug] = useState(creatorProfile.page_slug || '');
  const [isSaving, setIsSaving] = useState(false);

  const platformBaseUrl = new URL(getURL()).hostname; // e.g., saasinasnap.com or your-vercel-app.vercel.app
  const currentStorefrontUrl = `${getURL()}/c/${creatorProfile.page_slug}`;

  const handleSaveCustomSlug = async () => {
    setIsSaving(true);
    try {
      await updateCreatorPageSlugAction(customSlug);
      toast({
        description: 'Custom URL slug updated successfully!',
      });
    } catch (error) {
      console.error('Failed to update custom URL slug:', error);
      toast({
        variant: 'destructive',
        description: (error as Error).message || 'Failed to update custom URL slug. Please try again.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
        <Globe className="h-5 w-5" />
        Custom Domain Setup
      </h2>
      <p className="text-gray-600">
        Connect your own domain or subdomain to your SaaSinaSnap storefront for a fully branded experience.
      </p>

      {/* Current Storefront URL */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">Your Current Storefront URL</h3>
        <div className="flex items-center justify-between">
          <code className="text-sm font-mono text-blue-600 break-all pr-2">
            {currentStorefrontUrl}
          </code>
          <Button variant="outline" size="sm" asChild>
            <a href={currentStorefrontUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3 w-3 mr-1" />
              View
            </a>
          </Button>
        </div>
      </div>

      {/* Custom URL Slug Input */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
        <h3 className="font-medium text-lg text-gray-900">Set Your Custom URL Slug</h3>
        <div className="space-y-2">
          <Label htmlFor="customSlug">Custom URL Slug (e.g., `shop`, `products`, or `your-brand-name`)</Label>
          <Input
            id="customSlug"
            placeholder="your-brand-name"
            value={customSlug}
            onChange={(e) => setCustomSlug(e.target.value)}
            className="border-gray-300 bg-white text-gray-900 placeholder:text-gray-500"
          />
          <p className="text-xs text-gray-600">
            This will be used in your storefront URL: `{getURL()}/c/{customSlug || creatorProfile.id}`. Please enter a simple, URL-friendly name.
          </p>
        </div>
        <Button onClick={handleSaveCustomSlug} disabled={isSaving || customSlug === creatorProfile.page_slug}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Custom URL Slug
        </Button>
      </div>

      {/* Step-by-Step Guide */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
        <h3 className="font-medium text-lg text-gray-900">Step-by-Step Guide to Connect Your Domain</h3>
        <p className="text-gray-600 text-sm">
          To use your own domain (e.g., `shop.yourdomain.com`) for your storefront, follow these steps:
        </p>

        <ol className="list-decimal list-inside space-y-4 text-gray-700 text-sm">
          <li>
            **Choose Your Slug**: In the section above, enter your desired custom URL slug (e.g., `shop`, `products`, or your brand name) and click "Save Custom URL Slug". This will update your storefront URL on our platform.
          </li>
          <li>
            **Access Your Domain Registrar**: Log in to your domain registrar's website (e.g., GoDaddy, Namecheap, Cloudflare, Google Domains).
          </li>
          <li>
            **Navigate to DNS Settings**: Find the DNS management section for your domain. This might be labeled "DNS Settings", "Zone File Editor", or "Manage DNS".
          </li>
          <li>
            **Add a CNAME Record**:
            <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
              <li>**Type**: Select `CNAME` (Canonical Name).</li>
              <li>**Host/Name**: Enter the custom slug you chose in step 1 (e.g., `shop`). If you want to use your root domain (e.g., `yourdomain.com`), you'll typically use `@` or leave it blank, but this requires A records and is more complex. We recommend a subdomain for ease of setup.</li>
              <li>**Value/Target**: Point this to your SaaSinaSnap platform's Vercel deployment. Use: <code className="font-mono bg-gray-100 px-1 py-0.5 rounded text-blue-600">{platformBaseUrl}</code></li>
              <li>**TTL (Time To Live)**: You can usually leave this as default or set it to a low value (e.g., 300 seconds) for faster propagation.</li>
            </ul>
          </li>
          <li>
            **Save Changes**: Save the new DNS record.
          </li>
          <li>
            **Verify Connection**: It can take a few minutes to up to 48 hours for DNS changes to propagate globally. You can check if your domain is pointing correctly using online DNS lookup tools.
          </li>
        </ol>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 text-sm flex items-start gap-2">
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <p>
            **Important**: If you're using a root domain (e.g., `yourdomain.com`), you'll need to configure `A` records instead of `CNAME`. Please refer to Vercel's documentation for the specific IP addresses, or contact support for assistance.
          </p>
        </div>
      </div>
    </div>
  );
}