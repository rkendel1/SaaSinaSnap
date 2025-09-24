'use client';

import Link from 'next/link';
import { CheckCircle, ExternalLink, LayoutDashboard, UserPlus } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { PlatformSettings } from '../../types';

interface PlatformCompletionStepProps {
  settings: PlatformSettings;
  onComplete: () => void;
}

export function PlatformCompletionStep({ onComplete }: PlatformCompletionStepProps) {
  return (
    <div className="space-y-6 text-center">
      <CheckCircle className="h-16 w-16 mx-auto mb-4 text-green-600" />
      <h2 className="text-2xl font-bold text-green-900">
        🎉 Platform Setup Complete!
      </h2>
      <p className="text-muted-foreground text-lg max-w-xl mx-auto">
        Your PayLift platform is now fully configured and ready to welcome SaaS creators.
      </p>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border">
        <h3 className="font-semibold mb-4">What you've achieved:</h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left text-sm">
          <li className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Verified essential environment variables</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Set default branding for new creators</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Configured default white-labeled page content</span>
          </li>
          <li className="flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
            <span>Understood platform roles and creator onboarding</span>
          </li>
        </ul>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Next Steps:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={onComplete}
            size="lg"
            className="flex items-center gap-2"
          >
            <LayoutDashboard className="h-5 w-5" />
            Go to Platform Dashboard
          </Button>
          <Button 
            variant="outline"
            size="lg"
            className="flex items-center gap-2"
            asChild
          >
            <Link href="/creator/onboarding">
              <UserPlus className="h-5 w-5" />
              Test Creator Onboarding
            </Link>
          </Button>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">💡 Pro Tip:</h3>
        <p className="text-sm text-blue-700">
          Share your platform's main URL (`{process.env.NEXT_PUBLIC_SITE_URL}/signup`) with potential creators to get them started!
        </p>
      </div>

      <div className="text-center pt-4">
        <p className="text-sm text-muted-foreground">
          Need further assistance?{' '}
          <a href="/support" className="text-blue-600 hover:underline">Contact Support</a>
        </p>
      </div>
    </div>
  );
}