import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user'; // Import getAuthenticatedUser
import { getUser } from '@/features/account/controllers/get-user';
import { PlatformCreatorManager } from '@/features/platform-owner/components/PlatformCreatorManager';
import { getAllUsers } from '@/features/platform-owner/controllers/get-all-users';

export default async function PlatformCreatorsPage() {
  const authenticatedUser = await getAuthenticatedUser(); // Use getAuthenticatedUser

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  const user = await getUser(); // Fetch full user profile
  if (user?.role !== 'platform_owner') {
    redirect('/login');
  }

  const users = await getAllUsers();

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">Manage Creators</h1>
        <p className="text-gray-600">View and manage all the creators who have signed up on your SaaSinaSnap platform.</p>
      </div>
      <PlatformCreatorManager initialUsers={users} />
    </div>
  );
}