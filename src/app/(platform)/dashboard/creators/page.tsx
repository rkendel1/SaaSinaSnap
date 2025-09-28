import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { getUser } from '@/features/account/controllers/get-user';
import { UserManagement } from '@/features/platform-owner/components/UserManagement';
import { getAllUsers } from '@/features/platform-owner/controllers/get-all-users';
import { Tables } from '@/libs/supabase/types';

export default async function PlatformCreatorsPage() {
  const authenticatedUser = await getAuthenticatedUser(); // Use getAuthenticatedUser

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  const user = await getUser(); // Fetch full user profile
  if (!user || (user as Tables<'users'>).role !== 'platform_owner') {
    redirect('/login');
  }

  const users = await getAllUsers();

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">User Management</h1>
        <p className="text-gray-600">Manage all users on your SaaSinaSnap platform including creators, customers, and administrators.</p>
      </div>
      <UserManagement initialUsers={users} />
    </div>
  );
}