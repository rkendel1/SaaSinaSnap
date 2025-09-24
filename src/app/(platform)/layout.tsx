import { redirect } from 'next/navigation';

import { getSession } from '@/features/account/controllers/get-session';
import { getUser } from '@/features/account/controllers/get-user';

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const [session, user] = await Promise.all([getSession(), getUser()]);

  if (!session?.user?.id) {
    redirect('/login');
  }

  if (user?.role !== 'platform_owner') {
    // If the user is not a platform owner, redirect them away.
    // You might want to redirect to their creator dashboard or an error page.
    redirect('/creator/dashboard');
  }

  return <>{children}</>;
}