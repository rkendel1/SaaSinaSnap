'use client';

import { useState } from 'react';
import { ArrowRight, MessageSquare, Sparkles } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import type { PlatformSettings } from '../../types';

interface WelcomeMessageStepProps {
  settings: PlatformSettings;
  onNext: () => void;
  onPrevious: () => void;
}

export function WelcomeMessageStep({ settings, onNext, onPrevious }: WelcomeMessageStepProps) {
  const [welcomeTitle, setWelcomeTitle] = useState(
    settings.creator_welcome_title || 'Welcome to Your Creator Journey! 🎉'
  );
  const [welcomeMessage, setWelcomeMessage] = useState(
    settings.creator_welcome_message || 
    `We're thrilled to have you here! As a creator on our platform, you'll have access to powerful tools to build, manage, and grow your SaaS business.\n\nLet's get started by setting up your first product and customizing your storefront.`
  );

  const handleSave = async () => {
    // Save to platform settings
    // This would typically call an API to update settings
    console.log('Saving welcome message:', { welcomeTitle, welcomeMessage });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-100 rounded-lg">
          <Sparkles className="h-6 w-6 text-purple-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Creator Welcome Experience</h2>
          <p className="text-gray-600">Customize the first message creators see after signup</p>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-1">Make a Great First Impression</h3>
            <p className="text-sm text-blue-700">
              Your welcome message sets the tone for the creator experience. Make it warm, helpful, and encouraging.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="welcomeTitle" className="text-gray-900">Welcome Title</Label>
          <Input
            id="welcomeTitle"
            value={welcomeTitle}
            onChange={(e) => setWelcomeTitle(e.target.value)}
            placeholder="Welcome to Your Creator Journey! 🎉"
            className="mt-1"
          />
          <p className="text-sm text-gray-500 mt-1">
            A catchy, welcoming title to greet new creators
          </p>
        </div>

        <div>
          <Label htmlFor="welcomeMessage" className="text-gray-900">Welcome Message</Label>
          <textarea
            id="welcomeMessage"
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder="Write a welcoming message for new creators..."
            rows={6}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-gray-500 mt-1">
            Explain what creators can expect and how to get started
          </p>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-2">Preview</h3>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-3">{welcomeTitle}</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{welcomeMessage}</p>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onPrevious}>
          Previous
        </Button>
        <Button onClick={handleSave}>
          Next
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
