'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, CreditCard, ExternalLink, Eye, Globe, Rocket, Settings, Sparkles, Webhook } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import { getURL } from '@/utils/get-url';

import { completeOnboardingAction, updateCreatorProfileAction } from '../../actions/onboarding-actions';
import type { BusinessTypeOption, CreatorProfile } from '../../types';

interface ReviewLaunchStepProps {
  profile: CreatorProfile;
  businessType: BusinessTypeOption | null;
  selectedFeatures: string[];
  setSubmitFunction: (func: (() => Promise<void>) | null) => void;
  onComplete: (completed?: boolean) => void;
}

interface ValidationIssue {
  category: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  action?: string;
}

export function ReviewLaunchStep({ 
  profile, 
  businessType, 
  selectedFeatures, 
  setSubmitFunction,
  onComplete
}: ReviewLaunchStepProps) {
  const [validationIssues, setValidationIssues] = useState<ValidationIssue[]>([]);
  const [isLaunching, setIsLaunching] = useState(false);
  const [launchComplete, setLaunchComplete] = useState(false);

  // AI-assisted validation checks
  useEffect(() => {
    const issues: ValidationIssue[] = [];

    // Check business setup
    if (!profile.business_name) {
      issues.push({
        category: 'Business Setup',
        message: 'Business name is missing',
        severity: 'error',
        action: 'Add a business name in Profile Configuration'
      });
    }

    if (!profile.business_website) {
      issues.push({
        category: 'Brand Analysis',
        message: 'Website URL not provided for brand analysis',
        severity: 'warning',
        action: 'Consider adding your website for better branding'
      });
    }

    // Check Stripe connection
    if (!profile.stripe_account_id) {
      issues.push({
        category: 'Payment Setup',
        message: 'Stripe account not connected',
        severity: 'error',
        action: 'Connect your Stripe account to accept payments'
      });
    }

    // Check storefront
    if (!profile.brand_color || profile.brand_color === '#3b82f6') {
      issues.push({
        category: 'Storefront',
        message: 'Using default brand colors',
        severity: 'info',
        action: 'Customize your brand colors for better recognition'
      });
    }

    // Check page slug
    if (!profile.custom_domain) {
      issues.push({
        category: 'Storefront',
        message: 'Custom domain not set',
        severity: 'warning',
        action: 'Set a custom domain for your storefront URL'
      });
    }

    // Check integrations
    const enabledIntegrations = profile.enabled_integrations || [];
    if (enabledIntegrations.length === 0) {
      issues.push({
        category: 'Integrations',
        message: 'No integrations enabled',
        severity: 'info',
        action: 'Consider enabling Slack or analytics for better insights'
      });
    }

    setValidationIssues(issues);
  }, [profile]);

  const handleLaunch = useCallback(async () => {
    const criticalIssues = validationIssues.filter(issue => issue.severity === 'error');
    
    if (criticalIssues.length > 0) {
      toast({
        variant: 'destructive',
        description: `Please resolve ${criticalIssues.length} critical issue(s) before launching.`,
      });
      return;
    }

    setIsLaunching(true);
    try {
      // Complete the onboarding process
      await completeOnboardingAction();
      
      // Update profile to mark onboarding as complete
      await updateCreatorProfileAction({
        onboarding_completed: true,
      });

      setLaunchComplete(true);
      
      toast({
        description: 'Congratulations! Your SaaS platform is now live!',
      });

      // Auto-close after success
      setTimeout(() => {
        onComplete(true);
      }, 3000);
    } catch (error) {
      console.error('Failed to launch platform:', error);
      toast({
        variant: 'destructive',
        description: 'Failed to launch your platform. Please try again.',
      });
    } finally {
      setIsLaunching(false);
    }
  }, [validationIssues, onComplete]);

  // Set submit function for parent component
  useEffect(() => {
    setSubmitFunction(handleLaunch);
  }, [handleLaunch, setSubmitFunction]);

  const storefrontUrl = `${getURL()}/c/${profile.custom_domain || profile.id}`;
  const criticalIssues = validationIssues.filter(issue => issue.severity === 'error');
  const warnings = validationIssues.filter(issue => issue.severity === 'warning');
  const suggestions = validationIssues.filter(issue => issue.severity === 'info');

  if (launchComplete) {
    return (
      <div className="text-center space-y-6">
        <div className="flex justify-center">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
            <Rocket className="h-12 w-12 text-green-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-gray-900">🎉 Congratulations!</h2>
          <p className="text-xl text-gray-600">Your SaaS platform is now live!</p>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 space-y-4">
          <h3 className="font-semibold text-gray-900">Your platform is ready at:</h3>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
              {storefrontUrl}
            </span>
            <Button size="sm" variant="outline" asChild>
              <a href={storefrontUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Settings className="h-4 w-4 text-blue-600" />
              <span className="font-medium">Next Steps</span>
            </div>
            <p className="text-gray-600">Customize your products and pricing in the dashboard</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-green-600" />
              <span className="font-medium">Test Everything</span>
            </div>
            <p className="text-gray-600">Visit your storefront and test the customer experience</p>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="h-4 w-4 text-purple-600" />
              <span className="font-medium">Go Live</span>
            </div>
            <p className="text-gray-600">Share your platform with customers and start selling!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Review & Launch</h2>
        <p className="text-gray-600">
          Let&apos;s review your setup and ensure everything is ready for launch.
        </p>
      </div>

      <Tabs defaultValue="review" className="w-full">
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="review">Setup Review</TabsTrigger>
          <TabsTrigger value="validation">AI Validation</TabsTrigger>
          <TabsTrigger value="launch">Ready to Launch</TabsTrigger>
        </TabsList>

        {/* Setup Review */}
        <TabsContent value="review" className="space-y-6">
          <div className="grid gap-6">
            {/* Business & Brand */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Sparkles className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Business & Brand Setup</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Business Name:</span>
                  <p className="font-medium">{profile.business_name || 'Not set'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Business Type:</span>
                  <p className="font-medium">{businessType?.title || 'Not specified'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Website:</span>
                  <p className="font-medium">{profile.business_website || 'Not provided'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Brand Analysis:</span>
                  <p className="font-medium">
                    {profile.branding_extraction_status === 'completed' ? 'Complete' : 'Pending'}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment & Profile */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CreditCard className="h-5 w-5 text-green-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Payment & Profile</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Stripe Account:</span>
                  <p className="font-medium">
                    {profile.stripe_account_id ? 'Connected' : 'Not connected'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Custom Domain:</span>
                  <p className="font-medium">{profile.custom_domain || 'Using default'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Primary Color:</span>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded border"
                      style={{ backgroundColor: profile.brand_color || '#3b82f6' }}
                    />
                    <span className="font-medium">{profile.brand_color || '#3b82f6'}</span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Font Family:</span>
                  <p className="font-medium">Inter</p>
                </div>
              </div>
            </div>

            {/* Storefront & Integrations */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Webhook className="h-5 w-5 text-purple-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Storefront & Integrations</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Storefront URL:</span>
                  <p className="font-medium font-mono text-blue-600">{storefrontUrl}</p>
                </div>
                <div>
                  <span className="text-gray-600">Enabled Integrations:</span>
                  <p className="font-medium">
                    {(profile.enabled_integrations || []).length || 'None'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Webhook Endpoints:</span>
                  <p className="font-medium">
                    {(profile.webhook_endpoints || []).length || 'None configured'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Selected Features:</span>
                  <p className="font-medium">{selectedFeatures.length} features</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* AI Validation */}
        <TabsContent value="validation" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Sparkles className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">AI-Assisted Validation</h3>
                <p className="text-sm text-gray-600">
                  We&apos;ve analyzed your setup and identified areas for improvement
                </p>
              </div>
            </div>

            {validationIssues.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h4 className="font-medium text-gray-900 mb-2">Perfect Setup!</h4>
                <p className="text-gray-600">No issues found. Your platform is ready to launch.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Critical Issues */}
                {criticalIssues.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <h4 className="font-medium text-red-900">Critical Issues ({criticalIssues.length})</h4>
                    </div>
                    {criticalIssues.map((issue, index) => (
                      <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-red-900">{issue.category}</p>
                            <p className="text-sm text-red-800">{issue.message}</p>
                            {issue.action && (
                              <p className="text-xs text-red-700 mt-1">→ {issue.action}</p>
                            )}
                          </div>
                          <AlertCircle className="h-4 w-4 text-red-600 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Warnings */}
                {warnings.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      <h4 className="font-medium text-yellow-900">Warnings ({warnings.length})</h4>
                    </div>
                    {warnings.map((issue, index) => (
                      <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-yellow-900">{issue.category}</p>
                            <p className="text-sm text-yellow-800">{issue.message}</p>
                            {issue.action && (
                              <p className="text-xs text-yellow-700 mt-1">→ {issue.action}</p>
                            )}
                          </div>
                          <AlertCircle className="h-4 w-4 text-yellow-600 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      <h4 className="font-medium text-blue-900">Suggestions ({suggestions.length})</h4>
                    </div>
                    {suggestions.map((issue, index) => (
                      <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-blue-900">{issue.category}</p>
                            <p className="text-sm text-blue-800">{issue.message}</p>
                            {issue.action && (
                              <p className="text-xs text-blue-700 mt-1">→ {issue.action}</p>
                            )}
                          </div>
                          <CheckCircle className="h-4 w-4 text-blue-600 mt-1" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Launch Tab */}
        <TabsContent value="launch" className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Rocket className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-gray-900">Ready to Launch!</h3>
              <p className="text-gray-600">
                Your SaaS platform is configured and ready to go live.
              </p>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Your platform will be available at:</h4>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-blue-600 bg-white px-3 py-2 rounded-lg border">
                  {storefrontUrl}
                </span>
                <Button size="sm" variant="outline" asChild>
                  <a href={storefrontUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>

            {criticalIssues.length > 0 ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-2 justify-center mb-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-900">Cannot Launch Yet</span>
                </div>
                <p className="text-sm text-red-800">
                  Please resolve {criticalIssues.length} critical issue(s) before launching.
                </p>
              </div>
            ) : (
              <Button
                onClick={handleLaunch}
                disabled={isLaunching}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3"
                size="lg"
              >
                {isLaunching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Launching...
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-4 w-4" />
                    Launch My Platform
                  </>
                )}
              </Button>
            )}

            {warnings.length > 0 && criticalIssues.length === 0 && (
              <p className="text-xs text-gray-600">
                You have {warnings.length} warning(s) that can be addressed after launch.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}