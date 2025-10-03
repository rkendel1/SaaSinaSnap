import { redirect } from 'next/navigation';

import { getAuthenticatedUser } from '@/features/account/controllers/get-authenticated-user';
import { getAllUsers } from '@/features/platform-owner/controllers/get-all-users';

import { PlatformCreatorsClient } from './PlatformCreatorsClient';

export default async function PlatformCreatorsPage() {
  const authenticatedUser = await getAuthenticatedUser();

  if (!authenticatedUser?.id) {
    redirect('/login');
  }

  const users = await getAllUsers();

  return <PlatformCreatorsClient initialUsers={users} />;
}