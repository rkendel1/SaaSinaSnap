'use client';

import { useState } from 'react';
import { MessageSquare, UserCog, Users } from 'lucide-react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreatorFeedbackDashboard } from '@/features/platform-owner/components/CreatorFeedbackDashboard';
import { EnhancedCreatorOversight } from '@/features/platform-owner/components/EnhancedCreatorOversight';
import { UserManagement } from '@/features/platform-owner/components/UserManagement';

interface PlatformCreatorsClientProps {
  initialUsers: any[];
}

export function PlatformCreatorsClient({ initialUsers }: PlatformCreatorsClientProps) {
  const [activeTab, setActiveTab] = useState('management');

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-200">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Creator Management</h1>
        </div>
        <p className="text-gray-600">
          Manage users, monitor creator health and onboarding progress, and review feedback to ensure platform success.
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="management" className="flex items-center gap-2">
            <UserCog className="h-4 w-4" />
            User Management
          </TabsTrigger>
          <TabsTrigger value="oversight" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Oversight
          </TabsTrigger>
          <TabsTrigger value="feedback" className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Feedback
          </TabsTrigger>
        </TabsList>

        <TabsContent value="management" className="space-y-6">
          <UserManagement initialUsers={initialUsers} />
        </TabsContent>

        <TabsContent value="oversight" className="space-y-6">
          <EnhancedCreatorOversight />
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6">
          <CreatorFeedbackDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
