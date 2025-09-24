'use client';

import { BarChart3, CheckCircle, CreditCard, ExternalLink, Users, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { CreatorProfile } from '../../types';

interface CompletionStepProps {
  profile: CreatorProfile;
  onComplete: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export function CompletionStep({ profile, onComplete }: CompletionStepProps) {
  const storeFrontUrl = profile.custom_domain 
    ? `https://${profile.custom_domain}` 
    : `https://staryer.com/creator/${profile.id}/store`;

  const dashboardUrl = '/creator/dashboard';

  const features = [
    {
      icon: <CreditCard className="h-5 w-5" />,
      title: 'Payment Processing',
      description: 'Start accepting payments immediately through Stripe',
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: 'Customer Management',
      description: 'Track and manage your customers from one place',
    },
    {
      icon: <BarChart3 className="h-5 w-5" />,
      title: 'Analytics & Insights',
      description: 'Monitor your sales and customer behavior',
    },
    {
      icon: <Zap className="h-5 w-5" />,
      title: 'Automated Workflows',
      description: 'Webhooks keep your systems in sync automatically',
    },
  ];

  const nextSteps = [
    {
      title: 'Share Your Storefront',
      description: 'Start promoting your new SaaS to potential customers',
      action: 'Copy Link',
    },
    {
      title: 'Monitor Performance',
      description: 'Keep track of sales and customer activity',
      action: 'View Analytics',
    },
    {
      title: 'Customize Further',
      description: 'Fine-tune your pages and add more products',
      action: 'Edit Settings',
    },
    {
      title: 'Get Support',
      description: 'Join our community and access helpful resources',
      action: 'Visit Help Center',
    },
  ];

  return (
    <div className="space-y-6 text-center">
      <div>
        <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-green-900">
          🎉 Your SaaS is Live!
        </h2>
        <p className="text-muted-foreground text-lg">
          Congratulations! <strong>{profile.business_name || 'Your SaaS'}</strong> is now ready to serve customers.
        </p>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-6 border">
        <h3 className="font-semibold mb-4">Your new SaaS platform includes:</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5 text-green-600">
                {feature.icon}
              </div>
              <div>
                <h4 className="font-medium text-sm">{feature.title}</h4>
                <p className="text-xs text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between bg-white rounded-lg p-4 border shadow-sm">
          <div className="text-left">
            <h4 className="font-medium">Your Storefront URL</h4>
            <code className="text-sm text-blue-600 font-mono">{storeFrontUrl}</code>
          </div>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <ExternalLink className="h-3 w-3" />
            Open Store
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button 
            onClick={onComplete}
            size="lg"
            className="flex items-center gap-2"
          >
            Go to Dashboard
          </Button>
          <Button 
            variant="outline"
            size="lg"
            className="flex items-center gap-2"
            onClick={() => window.open(storeFrontUrl, '_blank')}
          >
            <ExternalLink className="h-4 w-4" />
            View Storefront
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold">Recommended Next Steps</h3>
        <div className="grid gap-3">
          {nextSteps.map((step, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50">
              <div className="text-left">
                <h4 className="font-medium text-sm">{step.title}</h4>
                <p className="text-xs text-muted-foreground">{step.description}</p>
              </div>
              <Button variant="ghost" size="sm" className="text-blue-600">
                {step.action}
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">🚀 Pro Tips for Success</h3>
        <ul className="text-sm text-blue-700 text-left space-y-1">
          <li>• Test your payment flow by making a small test purchase</li>
          <li>• Set up email notifications for new customers and sales</li>
          <li>• Create compelling product descriptions and pricing</li>
          <li>• Share your storefront on social media and with your network</li>
        </ul>
      </div>

      <div className="text-center pt-4">
        <p className="text-sm text-muted-foreground">
          Questions? We&apos;re here to help!{' '}
          <a href="/support" className="text-blue-600 hover:underline">Contact Support</a>
        </p>
      </div>
    </div>
  );
}