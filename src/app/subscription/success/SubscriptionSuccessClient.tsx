'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CheckCircle, Sparkles } from 'lucide-react';
import Stripe from 'stripe';

import { Button } from '@/components/ui/button';

interface SubscriptionSuccessClientProps {
  session: Stripe.Checkout.Session;
  userRole: string;
  hasCreatorProfile: boolean;
  onboardingCompleted: boolean;
}

export default function SubscriptionSuccessClient({
  session,
  userRole,
  hasCreatorProfile,
  onboardingCompleted,
}: SubscriptionSuccessClientProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          // Redirect to creator onboarding
          router.push('/creator/onboarding');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleContinue = () => {
    if (hasCreatorProfile && onboardingCompleted) {
      router.push('/creator/dashboard');
    } else {
      router.push('/creator/onboarding');
    }
  };

  const formatAmount = (amount: number | null) => {
    if (!amount) return '$0.00';
    return `$${(amount / 100).toFixed(2)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Success Icon */}
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🎉 Welcome to Your Creator Journey!
        </h1>
        
        {/* Subtitle */}
        <p className="text-gray-600 mb-6">
          Your subscription has been successfully activated. You're now ready to start building your creator business!
        </p>

        {/* Subscription Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-semibold text-gray-900 mb-3">Subscription Details</h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              <span className="text-green-600 font-medium">Active</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="text-gray-900 font-medium">
                {formatAmount(session.amount_total)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="text-gray-900 font-medium">
                {session.payment_method_types?.[0] || 'Card'}
              </span>
            </div>

            {session.mode === 'subscription' && (
              <div className="flex justify-between">
                <span className="text-gray-600">Type:</span>
                <span className="text-gray-900 font-medium">Recurring Subscription</span>
              </div>
            )}
          </div>
        </div>

        {/* Role Assignment Confirmation */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Creator Role Assigned
            </span>
          </div>
          <p className="text-xs text-blue-700">
            You now have access to all creator tools and features!
          </p>
        </div>

        {/* Next Steps */}
        <div className="text-left mb-6">
          <h4 className="font-semibold text-gray-900 mb-3">What's Next?</h4>
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span>Complete your creator profile setup</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span>Connect your Stripe account for payments</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span>Create your first product</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>
              <span>Launch your creator page</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button 
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            size="lg"
          >
            <span>Continue to Creator Onboarding</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          
          <p className="text-xs text-gray-500">
            Automatically redirecting in {countdown} seconds...
          </p>
        </div>

        {/* Support Link */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Need help? Contact our{' '}
            <a href="/help" className="text-blue-600 hover:underline">
              support team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}