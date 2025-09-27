'use client';

import { useEffect, useState } from 'react';
import { AlertTriangle,ArrowRight, CheckCircle, Info, TestTube, Zap } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

import type { CreatorProfile } from '../../types';

interface EnvironmentEducationStepProps {
  profile: CreatorProfile;
  onNext: () => void;
  onPrevious: () => void;
  isFirst: boolean;
  isLast: boolean;
  setSubmitFunction: (func: (() => Promise<void>) | null) => void;
}

export function EnvironmentEducationStep({ 
  profile, 
  onNext, 
  setSubmitFunction 
}: EnvironmentEducationStepProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [understandingProgress, setUnderstandingProgress] = useState(0);

  const slides = [
    {
      title: "Test Environment: Your Safe Playground",
      icon: <TestTube className="h-8 w-8 text-blue-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            The test environment is where you'll create and perfect your products without any risk. 
            Everything happens in Stripe's test mode with fake transactions.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">What you can do safely:</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>• Create subscription tiers and one-time products</li>
              <li>• Test payment flows with test credit cards</li>
              <li>• Experiment with pricing strategies</li>
              <li>• Build and customize your checkout experience</li>
              <li>• Validate your product offerings</li>
            </ul>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">Test card: 4242424242424242 (always succeeds)</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Production Environment: Going Live",
      icon: <Zap className="h-8 w-8 text-orange-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            When you're ready to accept real payments from customers, you'll deploy your tested products 
            to the production environment with one click.
          </p>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-orange-900 mb-2">Production features:</h4>
            <ul className="space-y-1 text-sm text-orange-800">
              <li>• Real customer payments and subscriptions</li>
              <li>• Automatic revenue tracking and reporting</li>
              <li>• Complete Stripe Dashboard access</li>
              <li>• Webhook notifications for events</li>
              <li>• Customer billing and invoice management</li>
            </ul>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">Only deploy when you're ready for real customers!</span>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Seamless Transition Process",
      icon: <ArrowRight className="h-8 w-8 text-green-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Our platform makes transitioning from test to production completely seamless for both 
            you and your customers.
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 text-xs font-bold">1</span>
              </div>
              <div>
                <strong className="text-gray-900">Validation Checks</strong>
                <p className="text-sm text-gray-600 mt-1">Automatic validation ensures your products are ready for production</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 text-xs font-bold">2</span>
              </div>
              <div>
                <strong className="text-gray-900">One-Click Deployment</strong>
                <p className="text-sm text-gray-600 mt-1">Deploy individual products or your entire catalog instantly</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 text-xs font-bold">3</span>
              </div>
              <div>
                <strong className="text-gray-900">Automatic Updates</strong>
                <p className="text-sm text-gray-600 mt-1">Your embeds and checkout links automatically switch to production</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Smart Product & Pricing Management",
      icon: <Info className="h-8 w-8 text-purple-500" />,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Our intelligent system uses stable Product IDs and dynamic Price IDs, giving you maximum 
            flexibility without technical complexity.
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
              <div className="pb-3">
                <h4 className="text-sm text-purple-900 font-semibold">Product IDs</h4>
                <p className="text-xs text-purple-700">Stable references</p>
              </div>
              <div className="pt-0">
                <ul className="text-xs text-purple-800 space-y-1">
                  <li>• Never change once created</li>
                  <li>• Embeds reference products safely</li>
                  <li>• Works across environments</li>
                </ul>
              </div>
            </div>
            <div className="border border-purple-200 rounded-lg p-4 bg-purple-50">
              <div className="pb-3">
                <h4 className="text-sm text-purple-900 font-semibold">Price IDs</h4>
                <p className="text-xs text-purple-700">Dynamic pricing</p>
              </div>
              <div className="pt-0">
                <ul className="text-xs text-purple-800 space-y-1">
                  <li>• Update pricing anytime</li>
                  <li>• No embed changes needed</li>
                  <li>• A/B test pricing strategies</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">
                This means you can iterate quickly without breaking existing customer links!
              </span>
            </div>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
      setUnderstandingProgress(((currentSlide + 2) / slides.length) * 100);
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
      setUnderstandingProgress(((currentSlide) / slides.length) * 100);
    }
  };

  const handleComplete = async () => {
    // Mark this education as complete and proceed
    onNext();
  };

  useEffect(() => {
    setSubmitFunction(() => handleComplete);
    return () => setSubmitFunction(null);
  }, [setSubmitFunction, onNext]);

  useEffect(() => {
    setUnderstandingProgress(((currentSlide + 1) / slides.length) * 100);
  }, [currentSlide]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold mb-2 text-gray-900">Understanding Your Stripe Environments</h2>
        <p className="text-gray-600">
          Learn how our smart environment management works to keep your business running smoothly
        </p>
      </div>

      {/* Progress indicator */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Understanding Progress</span>
          <span className="text-gray-900 font-medium">{Math.round(understandingProgress)}%</span>
        </div>
        <Progress value={understandingProgress} className="h-2" />
      </div>

      {/* Current environment badge */}
      <div className="flex justify-center">
        <div className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-50 text-blue-700 border border-blue-200">
          <TestTube className="h-3 w-3 mr-1" />
          You'll start in Test Environment
        </div>
      </div>

      {/* Main content card */}
      <div className="border border-gray-200 rounded-lg">
        <div className="text-center p-6 pb-4">
          <div className="flex justify-center mb-2">
            {slides[currentSlide].icon}
          </div>
          <h3 className="text-lg font-semibold">{slides[currentSlide].title}</h3>
        </div>
        <div className="p-6 pt-0">
          {slides[currentSlide].content}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentSlide === 0}
          className="flex items-center gap-2"
        >
          Previous
        </Button>
        
        {/* Slide indicators */}
        <div className="flex gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === currentSlide ? 'bg-blue-500' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>

        {currentSlide < slides.length - 1 ? (
          <Button onClick={handleNext} className="flex items-center gap-2">
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleComplete} className="flex items-center gap-2">
            I Understand
            <CheckCircle className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Quick reference */}
      {currentSlide === slides.length - 1 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mt-6">
          <h4 className="font-semibold text-gray-900 mb-2">Quick Reference</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TestTube className="h-4 w-4 text-blue-500" />
                <strong className="text-blue-700">Test Environment</strong>
              </div>
              <p className="text-gray-600 text-xs">Safe experimentation with test payments</p>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Zap className="h-4 w-4 text-orange-500" />
                <strong className="text-orange-700">Production Environment</strong>
              </div>
              <p className="text-gray-600 text-xs">Real customers and payments</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}