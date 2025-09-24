'use client';

import { CheckCircle, ExternalLink, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { PlatformSettings } from '../../types';

interface EnvVarReviewStepProps {
  settings: PlatformSettings;
  onNext: () => void;
}

export function EnvVarReviewStep({ onNext }: EnvVarReviewStepProps) {
  // In a real application, these would be checked server-side and passed as props
  // For this demo, we'll simulate checks.
  const envVars = [
    { name: 'NEXT_PUBLIC_SUPABASE_URL', status: 'set', required: true },
    { name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', status: 'set', required: true },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', status: 'set', required: true },
    { name: 'SUPABASE_DB_PASSWORD', status: 'set', required: true },
    { name: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', status: 'set', required: true },
    { name: 'STRIPE_SECRET_KEY', status: 'set', required: true },
    { name: 'STRIPE_WEBHOOK_SECRET', status: 'pending', required: true, note: 'Update after deployment' },
    { name: 'RESEND_API_KEY', status: 'set', required: true },
    { name: 'NEXT_PUBLIC_SITE_URL', status: 'set', required: true, note: 'Update to your deployed URL' },
  ];

  const allRequiredSet = envVars.every(v => v.status === 'set' || (v.status === 'pending' && v.name === 'STRIPE_WEBHOOK_SECRET'));

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2">Verify Environment Variables</h2>
        <p className="text-muted-foreground">
          Ensure all critical environment variables are correctly set in your `.env.local` file.
        </p>
      </div>

      <div className="bg-muted/30 rounded-lg p-6 space-y-4">
        <h3 className="font-medium text-lg">Required Variables</h3>
        <div className="space-y-3">
          {envVars.map((envVar, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg bg-background">
              <div className="flex items-center gap-3">
                {envVar.status === 'set' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <div>
                  <code className="font-mono text-sm">{envVar.name}</code>
                  {envVar.note && (
                    <p className="text-xs text-muted-foreground mt-0.5">{envVar.note}</p>
                  )}
                </div>
              </div>
              <span className={`text-sm font-medium ${envVar.status === 'set' ? 'text-green-600' : 'text-red-600'}`}>
                {envVar.status.charAt(0).toUpperCase() + envVar.status.slice(1)}
              </span>
            </div>
          ))}
        </div>
        {!allRequiredSet && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
            <p className="font-medium mb-2">Action Required:</p>
            <p>Please ensure all required environment variables are set. The `STRIPE_WEBHOOK_SECRET` can be updated after deployment.</p>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800 text-sm">
        <p className="font-medium mb-2">Need help?</p>
        <p>Refer to the `README.md` file in your project for detailed instructions on setting up these variables.</p>
        <Button variant="link" className="p-0 h-auto text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-2" asChild>
          <a href="https://github.com/KolbySisk/next-supabase-stripe-starter#getting-started" target="_blank" rel="noopener noreferrer">
            View README.md Setup Guide
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext} disabled={!allRequiredSet}>
          Continue
        </Button>
      </div>
    </div>
  );
}