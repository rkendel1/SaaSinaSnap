'use client';

import { Navigation } from '@/app/navigation';
import { Logo } from '@/components/logo';

export function AppBar({ session, user }: { session: any, user: any }) {
  return (
    <header className='flex items-center justify-between py-8'>
      <Logo />
      <Navigation session={session} user={user} />
    </header>
  );
}