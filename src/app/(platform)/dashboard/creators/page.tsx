import Link from 'next/link';
import { redirect } from 'next/navigation';
import { MessageSquare, Shield } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { UserManagement } from '@/features/platform-owner/components/UserManagement';
import { getAllUsers } from '@/features/platform-owner/controllers/get-all-users';

export default async function PlatformCreatorsPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  const users = await getAllUsers();

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-gray-900">Creator Management</h1>
            <p className="text-gray-600">Manage all creators on your SaaSinaSnap platform including oversight, feedback, and user management.</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/creator-oversight">
              <Button variant="outline" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Oversight
              </Button>
            </Link>
            <Link href="/dashboard/creator-feedback">
              <Button variant="outline" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Feedback
              </Button>
            </Link>
          </div>
        </div>
      </div>
      <UserManagement initialUsers={users} />
    </div>
  );
}