'use client';

import { ArrowRight, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';

import type { PlatformSettings } from '../../types';

interface RoleManagementOverviewStepProps {
  settings: PlatformSettings;
  onNext: () => void;
}

export function RoleManagementOverviewStep({ onNext }: RoleManagementOverviewStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
        <h2 className="text-xl font-semibold mb-2 text-gray-50">Role Management Overview</h2>
        <p className="text-gray-300">
          Understand the different roles within your PayLift platform and how they interact.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 text-gray-100">
          <h3 className="font-semibold text-lg mb-2 text-gray-50">Platform Owner</h3>
          <p className="text-sm text-gray-300 mb-4">
            (That's you!) Full administrative control over the entire platform, including global settings, creator management, and system configurations.
          </p>
          <ul className="list-disc list-inside text-xs text-gray-400 space-y-1">
            <li>Manage platform settings</li>
            <li>Oversee all creators</li>
            <li>Access global analytics</li>
          </ul>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 text-gray-100">
          <h3 className="font-semibold text-lg mb-2 text-gray-50">Creator</h3>
          <p className="text-sm text-gray-300 mb-4">
            Individuals or businesses who use PayLift to sell their SaaS products and manage their subscribers.
          </p>
          <ul className="list-disc list-inside text-xs text-gray-400 space-y-1">
            <li>Create and manage products</li>
            <li>Customize their storefront</li>
            <li>View their own sales analytics</li>
          </ul>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 border border-gray-700 text-gray-100">
          <h3 className="font-semibold text-lg mb-2 text-gray-50">Subscriber</h3>
          <p className="text-sm text-gray-300 mb-4">
            Customers who purchase products or subscriptions from your creators.
          </p>
          <ul className="list-disc list-inside text-xs text-gray-400 space-y-1">
            <li>Access purchased products</li>
            <li>Manage their subscriptions</li>
            <li>Interact with creator's branded pages</li>
          </ul>
        </div>
      </div>

      <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 text-blue-200 text-sm">
        <p className="font-medium mb-2">How roles are enforced:</p>
        <p>
          PayLift uses Supabase Row Level Security (RLS) policies to ensure each user (platform owner, creator, subscriber) only has access to the data relevant to their role. This is configured in your Supabase database migrations.
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={onNext}>
          Continue
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}